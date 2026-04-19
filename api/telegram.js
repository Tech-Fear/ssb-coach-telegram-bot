const {
  ensureSchema,
  upsertChat,
  getOpenPracticeSession,
  closePracticeSession,
} = require("../lib/db");
const { sendMessage, sendPhotoWithFallback } = require("../lib/telegram");
const { buildDailyPack, formatDailyPackMessages } = require("../lib/daily");
const {
  createPracticePrompt,
  evaluatePracticeReply,
  getPracticeHelpText,
} = require("../lib/practice");
const { runManualCurrentAffair } = require("../lib/current-affairs");
const { getVocabPool, enrichVocabItem } = require("../lib/vocab-service");

const SRT_PROMPTS = [
  {
    situation:
      "You are leading a team project with a tight deadline. Midway through, your key team member informs you they need to take emergency leave. Your timeline is now at risk.",
    reaction: "How would you handle this situation? Share your response below.",
  },
  {
    situation:
      "During a team meeting, a colleague publicly criticizes your idea in front of senior management. The criticism seems unfair and politically motivated.",
    reaction: "How would you react? What would be your approach?",
  },
  {
    situation:
      "You discover that a team member has been taking credit for another colleague's work. The person being cheated has approached you confidentially.",
    reaction: "How would you handle this situation? What steps would you take?",
  },
  {
    situation:
      "You've been assigned to manage a team with very diverse backgrounds and conflicting work styles. Some members aren't cooperating well.",
    reaction: "How would you create harmony and ensure effective teamwork?",
  },
  {
    situation:
      "A task you assigned to someone was completed poorly, and it's affecting the project. However, this person is new and still learning.",
    reaction: "How would you provide feedback and guidance?",
  },
  {
    situation:
      "You realize you've made a significant mistake that could impact the project deadline and team morale.",
    reaction: "How would you address this and move forward?",
  },
];

const WAT_PROMPTS = [
  "Leadership",
  "Failure",
  "Success",
  "Challenge",
  "Conflict",
  "Team",
  "Decision",
  "Trust",
  "Innovation",
  "Responsibility",
  "Courage",
  "Change",
  "Growth",
  "Loyalty",
  "Integrity",
];

const TAT_STORIES = [
  "A young man is sitting at a table, looking troubled. On the wall behind him are photographs.",
  "Two women are in what appears to be a tense conversation. One looks away.",
  "An older man is watching a young boy working at something. The boy hasn't noticed him.",
  "A figure lies on a bed while another person stands looking out the window.",
  "Two people are arguing. One person's fist is clenched while the other person backs away.",
];

const PPDT_IMAGES = [
  "You see an unclear image that could be a person climbing a mountain or struggling with something.",
  "You see a vague silhouette that might be two people together or a single figure in different poses.",
  "You see blurred shapes that could be people in a scene - describe what you see and create a story.",
  "You see an indistinct image - interpret it as a scene involving leadership or teamwork.",
  "You see an abstract image - describe the figures you see and what they might be doing.",
];

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
  return (
    update?.message ||
    update?.edited_message ||
    update?.channel_post ||
    update?.edited_channel_post ||
    null
  );
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
      await sendPhotoWithFallback(chatId, item.photoCandidates, item.caption);
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
        "",
        "*Tests & Exercises:*",
        "/vocab - Random vocabulary or /vocab [word] for specific word",
        "/srt - Situation Reaction Test",
        "/wat - Word Association Test",
        "/tat - Thematic Apperception Test",
        "/ppdt - Picture Perception and Description Test",
        "",
        "Or use /practice [type] for evaluated practice sessions.",
        "Use /help to see all commands.",
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
    return;
  }

  if (normalizedCommand === "/help") {
    await sendMessage(
      chatId,
      getPracticeHelpText() +
        "\n\n" +
        [
          "*Standalone Tests & Exercises:*",
          "/vocab - Get a random vocabulary word",
          "/vocab [word] - Get details for a specific word",
          "/srt - Situation Reaction Test",
          "/wat - Word Association Test",
          "/tat - Thematic Apperception Test",
          "/ppdt - Picture Perception and Description Test",
          "",
          "Or use /practice [type] for evaluated sessions.",
        ].join("\n"),
      { parse_mode: "Markdown" },
    );
    return;
  }

  if (normalizedCommand === "/registerdaily") {
    await upsertChat({ id: chatId, dailyEnabled: true });
    await sendMessage(chatId, "Daily delivery is enabled for this chat.");
    return;
  }

  if (normalizedCommand === "/unregisterdaily") {
    if (
      !process.env.ADMIN_SECRET ||
      parts[1] !== process.env.ADMIN_SECRET.toLowerCase()
    ) {
      await sendMessage(
        chatId,
        "Unknown command. Use /help to see the available commands.",
      );
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

  if (normalizedCommand === "/vocab") {
    const word = parts[1];
    if (word) {
      // User requested specific word
      const vocabItem = {
        key: `vocab-${word.toLowerCase()}`,
        type: "vocab",
        word: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      };
      try {
        const enriched = await enrichVocabItem(vocabItem);
        const message = [
          `📚 *${enriched.word}*`,
          `POS: _${enriched.partOfSpeech}_`,
          "",
          `Meaning: ${enriched.meaning}`,
          enriched.hindiMeaning ? `Hindi: ${enriched.hindiMeaning}` : null,
          `Synonym: ${enriched.synonym}`,
          `Antonym: ${enriched.antonym}`,
          enriched.example ? `\nExample: _${enriched.example}_` : null,
        ]
          .filter(Boolean)
          .join("\n");
        await sendMessage(chatId, message, { parse_mode: "Markdown" });
      } catch {
        await sendMessage(
          chatId,
          `Could not find details for "${word}". Try another word.`,
        );
      }
    } else {
      // Random vocabulary
      try {
        const pool = await getVocabPool();
        const randomItem = pool[Math.floor(Math.random() * pool.length)];
        const enriched = await enrichVocabItem(randomItem);
        const message = [
          `📚 *${enriched.word}*`,
          `POS: _${enriched.partOfSpeech}_`,
          "",
          `Meaning: ${enriched.meaning}`,
          enriched.hindiMeaning ? `Hindi: ${enriched.hindiMeaning}` : null,
          `Synonym: ${enriched.synonym}`,
          `Antonym: ${enriched.antonym}`,
          enriched.example ? `\nExample: _${enriched.example}_` : null,
        ]
          .filter(Boolean)
          .join("\n");
        await sendMessage(chatId, message, { parse_mode: "Markdown" });
      } catch (e) {
        console.error("Error generating vocab:", e);
        await sendMessage(chatId, "Failed to generate vocabulary. Try again.");
      }
    }
    return;
  }

  if (normalizedCommand === "/srt") {
    const randomPrompt =
      SRT_PROMPTS[Math.floor(Math.random() * SRT_PROMPTS.length)];
    const message = `*🎯 Situation Reaction Test (SRT)*\n\n*Situation:*\n${randomPrompt.situation}\n\n*Your Reaction:*\n${randomPrompt.reaction}`;
    await sendMessage(chatId, message, { parse_mode: "Markdown" });
    return;
  }

  if (normalizedCommand === "/wat") {
    const randomWord =
      WAT_PROMPTS[Math.floor(Math.random() * WAT_PROMPTS.length)];
    const message = `*📝 Word Association Test (WAT)*\n\n*Word:* ${randomWord}\n\nAssociate freely - write any words or ideas that come to your mind related to this word.`;
    await sendMessage(chatId, message, { parse_mode: "Markdown" });
    return;
  }

  if (normalizedCommand === "/tat") {
    const randomStory =
      TAT_STORIES[Math.floor(Math.random() * TAT_STORIES.length)];
    const message = `*🖼️ Thematic Apperception Test (TAT)*\n\n*Scene:*\n${randomStory}\n\nCreate a story about this scene:\n- What led to this situation?\n- What are the people thinking and feeling?\n- What might happen next?`;
    await sendMessage(chatId, message, { parse_mode: "Markdown" });
    return;
  }

  if (normalizedCommand === "/ppdt") {
    const randomImage =
      PPDT_IMAGES[Math.floor(Math.random() * PPDT_IMAGES.length)];
    const message = `*🎨 Picture Perception and Description Test (PPDT)*\n\n${randomImage}\n\nDescribe what you see and create a story:\n- Identify the main figures/objects\n- Describe their actions and relationships\n- Create a narrative about what's happening`;
    await sendMessage(chatId, message, { parse_mode: "Markdown" });
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
      improvements: ["Try answering the next prompt fully in one message."],
    });
    await sendMessage(
      chatId,
      "Skipped. Send another /practice command when you want a fresh prompt.",
    );
    return;
  }

  const practiceType = parsePracticeType(commandText);
  if (practiceType) {
    const openSession = await getOpenPracticeSession(chatId);
    if (openSession) {
      await sendMessage(
        chatId,
        "You already have an open practice prompt. Reply to it or use /skip first.",
      );
      return;
    }
    const prompt = await createPracticePrompt(chatId, practiceType);
    if (prompt.type === "photo") {
      try {
        await sendPhotoWithFallback(
          chatId,
          prompt.photoCandidates,
          prompt.caption,
        );
      } catch {
        await sendMessage(chatId, prompt.textFallback || prompt.caption);
      }
    } else {
      await sendMessage(chatId, prompt.text);
    }
    return;
  }

  await sendMessage(
    chatId,
    "Unknown command. Use /help to see the available commands.",
  );
}

async function handleAnswer(chatId, text) {
  const openSession = await getOpenPracticeSession(chatId);
  if (!openSession) return;

  const evaluation = evaluatePracticeReply(openSession.payload, text);
  await closePracticeSession(openSession.id, text, evaluation);

  const message = [
    `Score: ${evaluation.score}/10`,
    `Summary: ${evaluation.summary}`,
    evaluation.strengths.length
      ? `What went well: ${evaluation.strengths.join("; ")}`
      : "",
    evaluation.missing.length
      ? `What is missing: ${evaluation.missing.join("; ")}`
      : "",
    evaluation.improvements.length
      ? `How to improve: ${evaluation.improvements.join("; ")}`
      : "",
    `Model answer:\n${evaluation.betterAnswer}`,
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
    req.headers["x-telegram-bot-api-secret-token"] !==
      process.env.TELEGRAM_WEBHOOK_SECRET
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
    username: chat.username || null,
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
