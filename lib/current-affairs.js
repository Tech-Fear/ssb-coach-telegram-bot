const { XMLParser } = require("fast-xml-parser");
const { sendMessage } = require("./telegram");
const {
  getLastCurrentAffairWindowEnd,
  setLastCurrentAffairWindowEnd,
  getOrCreateCurrentAffairJob,
  markCurrentAffairJobSuccess,
  markCurrentAffairJobFailure,
  listDueCurrentAffairJobs
} = require("./db");

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const HALF_HOUR_MS = 30 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });

const FEEDS = [
  {
    category: "Military",
    source: "Defense.gov",
    url: "https://www.war.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=10"
  },
  {
    category: "Government",
    source: "PIB India",
    url: "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1"
  },
  {
    category: "Geopolitics",
    source: "BBC World",
    url: "http://newsrss.bbc.co.uk/rss/newsonline_uk_edition/world/rss.xml"
  },
  {
    category: "Geopolitics",
    source: "BBC Politics",
    url: "http://newsrss.bbc.co.uk/rss/newsonline_uk_edition/uk_politics/rss.xml"
  }
];

function stripHtml(text) {
  return (text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseItemDate(item) {
  const raw = item.pubDate || item.published || item.updated || item.date;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

async function fetchFeedItems(feed) {
  const response = await fetch(feed.url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) {
    throw new Error(`${feed.source} feed returned ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);
  const channelItems = toArray(parsed?.rss?.channel?.item);
  const atomEntries = toArray(parsed?.feed?.entry);
  const items = channelItems.length ? channelItems : atomEntries;

  return items.map((item) => ({
    title: stripHtml(item.title),
    link: item.link?.href || item.link || item.guid || "",
    description: stripHtml(item.description || item.summary || item.content || ""),
    publishedAt: parseItemDate(item),
    source: feed.source,
    category: feed.category
  }));
}

function formatIst(date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function getTodaySevenPmIst(referenceDate = new Date()) {
  const istNow = new Date(referenceDate.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 13, 30, 0, 0));
}

function getScheduledWindow(referenceDate = new Date()) {
  const end = getTodaySevenPmIst(referenceDate);
  return {
    windowStart: new Date(end.getTime() - DAY_MS),
    windowEnd: end
  };
}

function getManualWindow(lastWindowEnd, referenceDate = new Date()) {
  const defaultStart = new Date(getTodaySevenPmIst(referenceDate).getTime() - DAY_MS);
  return {
    windowStart: lastWindowEnd ? new Date(lastWindowEnd) : defaultStart,
    windowEnd: referenceDate
  };
}

async function fetchCurrentAffairDigest(windowStart, windowEnd) {
  const settled = await Promise.allSettled(FEEDS.map((feed) => fetchFeedItems(feed)));
  const items = [];
  const errors = [];

  for (let index = 0; index < settled.length; index += 1) {
    const result = settled[index];
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      errors.push(`${FEEDS[index].source}: ${result.reason.message}`);
    }
  }

  const filtered = items
    .filter((item) => item.title && item.publishedAt && item.publishedAt > windowStart && item.publishedAt <= windowEnd)
    .sort((a, b) => b.publishedAt - a.publishedAt);

  const deduped = [];
  const seen = new Set();
  for (const item of filtered) {
    const key = `${item.title}::${item.link}`;
    if (!seen.has(key)) {
      deduped.push(item);
      seen.add(key);
    }
  }

  const byCategory = new Map();
  for (const item of deduped) {
    if (!byCategory.has(item.category)) {
      byCategory.set(item.category, []);
    }
    if (byCategory.get(item.category).length < 4) {
      byCategory.get(item.category).push(item);
    }
  }

  return {
    sections: Array.from(byCategory.entries()).map(([category, rows]) => ({ category, rows })),
    errors
  };
}

function formatCurrentAffairMessage(report, windowStart, windowEnd) {
  const lines = [
    "Current Affairs Update",
    `Window: ${formatIst(windowStart)} IST to ${formatIst(windowEnd)} IST`
  ];

  for (const section of report.sections) {
    lines.push(`\n${section.category}`);
    section.rows.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.title}`,
        `Source: ${item.source} | Time: ${formatIst(item.publishedAt)} IST`,
        `Summary: ${item.description || "Summary not available in the feed."}`,
        `Link: ${item.link}`
      );
    });
  }

  if (!report.sections.length) {
    lines.push("\nNo qualifying current-affair items were found in this window.");
  }

  if (report.errors.length) {
    lines.push(`\nFeed warnings: ${report.errors.join(" | ")}`);
  }

  return lines.join("\n");
}

function computeNextRetry(attemptCount) {
  return new Date(Date.now() + HALF_HOUR_MS * Math.pow(2, Math.max(0, attemptCount - 1)));
}

async function attemptCurrentAffairDelivery(chatId, windowStart, windowEnd, { manual = false } = {}) {
  const report = await fetchCurrentAffairDigest(windowStart, windowEnd);
  if (!report.sections.length && report.errors.length) {
    throw new Error(report.errors.join(" | "));
  }
  const message = formatCurrentAffairMessage(report, windowStart, windowEnd);
  await sendMessage(chatId, message);
  if (!manual) {
    await setLastCurrentAffairWindowEnd(chatId, windowEnd);
  }
  return report;
}

async function runScheduledCurrentAffair(chatId, referenceDate = new Date()) {
  const { windowStart, windowEnd } = getScheduledWindow(referenceDate);
  const job = await getOrCreateCurrentAffairJob(chatId, windowStart, windowEnd);
  if (job.status === "success") {
    return { status: "already_sent", chatId, jobId: job.id };
  }

  try {
    const report = await attemptCurrentAffairDelivery(chatId, windowStart, windowEnd);
    await markCurrentAffairJobSuccess(job.id);
    return { status: "sent", chatId, jobId: job.id, sections: report.sections.length };
  } catch (error) {
    const nextAttempt = job.attempt_count + 1;
    const nextRetryAt = nextAttempt >= 3 ? null : computeNextRetry(nextAttempt);
    const status = nextAttempt >= 3 ? "failed" : "pending";
    await markCurrentAffairJobFailure(job.id, nextAttempt, error.message, nextRetryAt, status);
    await sendMessage(
      chatId,
      `Current affairs update failed for ${formatIst(windowStart)} IST to ${formatIst(windowEnd)} IST. Attempt ${nextAttempt}/3. Reason: ${error.message}${nextRetryAt ? `. Next retry after ${formatIst(nextRetryAt)} IST.` : ". No further automatic retries are pending."}`
    );
    throw error;
  }
}

async function runManualCurrentAffair(chatId, referenceDate = new Date()) {
  const lastWindowEnd = await getLastCurrentAffairWindowEnd(chatId);
  const { windowStart, windowEnd } = getManualWindow(lastWindowEnd, referenceDate);
  try {
    const report = await attemptCurrentAffairDelivery(chatId, windowStart, windowEnd, { manual: true });
    return { status: "sent", chatId, sections: report.sections.length };
  } catch (error) {
    await sendMessage(chatId, `Current affairs request failed. Reason: ${error.message}`);
    throw error;
  }
}

async function retryDueCurrentAffairJobs() {
  const jobs = await listDueCurrentAffairJobs();
  const results = [];

  for (const job of jobs) {
    const windowStart = new Date(job.window_start);
    const windowEnd = new Date(job.window_end);
    try {
      const report = await attemptCurrentAffairDelivery(job.chat_id, windowStart, windowEnd);
      await markCurrentAffairJobSuccess(job.id);
      results.push({ chatId: job.chat_id, status: "sent", jobId: job.id, sections: report.sections.length });
    } catch (error) {
      const nextAttempt = job.attempt_count + 1;
      const nextRetryAt = nextAttempt >= 3 ? null : computeNextRetry(nextAttempt);
      const status = nextAttempt >= 3 ? "failed" : "pending";
      await markCurrentAffairJobFailure(job.id, nextAttempt, error.message, nextRetryAt, status);
      await sendMessage(
        job.chat_id,
        `Current affairs retry failed for ${formatIst(windowStart)} IST to ${formatIst(windowEnd)} IST. Attempt ${nextAttempt}/3. Reason: ${error.message}${nextRetryAt ? `. Next retry after ${formatIst(nextRetryAt)} IST.` : ". No further automatic retries are pending."}`
      );
      results.push({ chatId: job.chat_id, status, jobId: job.id, reason: error.message });
    }
  }

  return results;
}

module.exports = {
  fetchCurrentAffairDigest,
  formatCurrentAffairMessage,
  getScheduledWindow,
  getManualWindow,
  runScheduledCurrentAffair,
  runManualCurrentAffair,
  retryDueCurrentAffairJobs
};
