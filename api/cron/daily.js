const { ensureSchema, listDailyChats } = require("../../lib/db");
const { buildDailyPack, formatDailyPackMessages } = require("../../lib/daily");
const { sendMessage } = require("../../lib/telegram");

module.exports = async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ ok: false });
    return;
  }

  await ensureSchema();
  const chats = await listDailyChats();
  const results = [];

  for (const chat of chats) {
    try {
      const pack = await buildDailyPack(chat.chat_id);
      for (const message of formatDailyPackMessages(pack)) {
        await sendMessage(chat.chat_id, message);
      }
      results.push({ chatId: chat.chat_id, status: "sent" });
    } catch (error) {
      console.error(`daily-send-failed:${chat.chat_id}`, error);
      results.push({ chatId: chat.chat_id, status: "failed", reason: error.message });
    }
  }

  res.status(200).json({ ok: true, count: chats.length, results });
};
