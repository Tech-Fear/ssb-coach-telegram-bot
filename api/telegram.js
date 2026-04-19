const { ensureSchema, upsertChat, getOpenPracticeSession, closePracticeSession } = require("../lib/db");
const { sendMessage, sendPhoto } = require("../lib/telegram");
const { buildDailyPack, formatDailyPackMessages } = require("../lib/daily");
const { createPracticePrompt, evaluatePracticeReply, getPracticeHelpText } = require("../lib/practice");
const { runManualCurrentAffair } = require("../lib/current-affairs");

function getMessageText(update) {
  return (
    update?.message?.text ||
    update?.edited_message?.text ||
    update?.channel_post?.text ||
    update?.edited_channel_post?.text ||
    ""
  );
}

function getMessageObject(update) {
  return update?.message || update?.edited_message || update?.channel_post || update?.edited_channel_post || null;
}

function normalizeBody(body) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

function getCommandParts(text) {
  return text.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function parsePracticeType(text) {
  const parts = getCommandParts(text);
  if (parts[0]?.split("@")[0] !== "/practice") return null;
  return parts[1] || null;
}

async function sendDailyPack(chatId) {
  const pack = await buildDailyPack(chatId);
  for (const item of formatDailyPackMessages(pack)) {
    if (item.type === "photo") {
      await sendPhoto(chatId, item.photoUrl, item.caption);
    } else {
      await sendMessage(chatId, item.text);
    }
  }
}

async function handleCommand(chatId, commandText) {
  const parts = getCommandParts(commandText);
  const normalizedCommand = (parts[0] || "").split("@")[0];

  if (normalizedCommand === "/start") {
    await sendMessage(
      chatId,
      [
        "SSB Coach is active.",
        "Use /registerdaily to receive the daily pack.",
        "Use /today_current_affair for the latest current-affairs digest.",
        "Use /practice vocab, /practice wat, /practice tat, /practice srt, or /practice ppdt to start answer evaluation.",
        "Use /help to see all commands."
      ].join("\n")
    );
    return;
  }

  if (normalizedCommand === "/help") {
    await sendMessage(chatId, getPracticeHelpText());
    return;
  }

  if (normalizedCommand === "/registerdaily") {
    await upsertChat({ id: chatId, dailyEnabled: true });
    await sendMessage(chatId, "Daily delivery is enabled for this chat.");
    return;
  }

  if (normalizedCommand === "/unregisterdaily") {
    if (!process.env.ADMIN_SECRET || parts[1] !== process.env.ADMIN_SECRET.toLowerCase()) {
      await sendMessage(chatId, "Unknown command. Use /help to see the available commands.");
      return;
    }
    await upsertChat({ id: chatId, dailyEnabled: false });
    await sendMessage(chatId, "Daily delivery is disabled for this chat.");
    return;
  }

  if (normalizedCommand === "/sendtoday") {
    await sendDailyPack(chatId);
    return;
  }

  if (normalizedCommand === "/today_current_affair") {
    await runManualCurrentAffair(chatId);
    return;
  }

  if (normalizedCommand === "/skip") {
    const openSession = await getOpenPracticeSession(chatId);
    if (!openSession) {
      await sendMessage(chatId, "There is no active practice prompt to skip.");
      return;
    }
    await closePracticeSession(openSession.id, "[skipped]", {
      score: 0,
      summary: "Prompt skipped by user.",
      missing: ["No answer submitted."],
      betterAnswer: openSession.payload.modelAnswer,
      strengths: [],
      improvements: ["Try answering the next prompt fully in one message."]
    });
    await sendMessage(chatId, "Skipped. Send another /practice command when you want a fresh prompt.");
    return;
  }

  const practiceType = parsePracticeType(commandText);
  if (practiceType) {
    const openSession = await getOpenPracticeSession(chatId);
    if (openSession) {
      await sendMessage(chatId, "You already have an open practice prompt. Reply to it or use /skip first.");
      return;
    }
    const prompt = await createPracticePrompt(chatId, practiceType);
    await sendMessage(chatId, prompt.message);
    return;
  }

  await sendMessage(chatId, "Unknown command. Use /help to see the available commands.");
}

async function handleAnswer(chatId, text) {
  const openSession = await getOpenPracticeSession(chatId);
  if (!openSession) return;

  const evaluation = evaluatePracticeReply(openSession.payload, text);
  await closePracticeSession(openSession.id, text, evaluation);

  const message = [
    `Score: ${evaluation.score}/10`,
    `Summary: ${evaluation.summary}`,
    evaluation.strengths.length ? `What went well: ${evaluation.strengths.join("; ")}` : "",
    evaluation.missing.length ? `What is missing: ${evaluation.missing.join("; ")}` : "",
    evaluation.improvements.length ? `How to improve: ${evaluation.improvements.join("; ")}` : "",
    `Model answer:\n${evaluation.betterAnswer}`
  ]
    .filter(Boolean)
    .join("\n\n");

  await sendMessage(chatId, message);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(200).json({ ok: true, message: "Telegram webhook endpoint" });
    return;
  }

  if (
    process.env.TELEGRAM_WEBHOOK_SECRET &&
    req.headers["x-telegram-bot-api-secret-token"] !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    res.status(401).json({ ok: false });
    return;
  }

  await ensureSchema();

  const update = normalizeBody(req.body);
  const message = getMessageObject(update);
  const text = getMessageText(update).trim();
  const chat = message?.chat;

  if (!chat || !text) {
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  await upsertChat({
    id: chat.id,
    type: chat.type,
    title: chat.title || null,
    username: chat.username || null
  });

  try {
    if (text.startsWith("/")) {
      await handleCommand(chat.id, text);
    } else {
      await handleAnswer(chat.id, text);
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    await sendMessage(chat.id, `Something went wrong: ${error.message}`);
    res.status(500).json({ ok: false });
  }
};
