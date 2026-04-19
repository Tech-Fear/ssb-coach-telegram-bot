const { ensureSchema, listDailyChats } = require("../../lib/db");
const { buildDailyPack, formatDailyPackMessages } = require("../../lib/daily");
const { sendMessage, sendPhoto } = require("../../lib/telegram");
const { runScheduledCurrentAffair } = require("../../lib/current-affairs");

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

module.exports = async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ ok: false });
    return;
  }

  await ensureSchema();
  const chats = await listDailyChats();
  const results = [];

  for (const chat of chats) {
    const row = { chatId: chat.chat_id };
    try {
      await sendDailyPack(chat.chat_id);
      row.dailyPack = "sent";
    } catch (error) {
      row.dailyPack = `failed: ${error.message}`;
    }

    try {
      const currentAffairResult = await runScheduledCurrentAffair(chat.chat_id);
      row.currentAffairs = currentAffairResult.status;
    } catch (error) {
      row.currentAffairs = `failed: ${error.message}`;
    }

    results.push(row);
  }

  res.status(200).json({ ok: true, count: chats.length, results });
};
