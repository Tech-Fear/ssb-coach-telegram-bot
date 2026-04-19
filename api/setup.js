const { ensureSchema } = require("../lib/db");
const { setWebhook, setCommands, getMe } = require("../lib/telegram");

module.exports = async function handler(req, res) {
  if (!process.env.ADMIN_SECRET || req.query.secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ ok: false });
    return;
  }

  if (!process.env.WEBHOOK_BASE_URL) {
    res.status(400).json({ ok: false, error: "WEBHOOK_BASE_URL is required" });
    return;
  }

  await ensureSchema();

  const webhookUrl = `${process.env.WEBHOOK_BASE_URL.replace(/\/$/, "")}/api/telegram`;
  const me = await getMe();
  const webhook = await setWebhook(webhookUrl, process.env.TELEGRAM_WEBHOOK_SECRET);

  await setCommands([
    { command: "start", description: "Start the bot" },
    { command: "help", description: "Show all commands" },
    { command: "registerdaily", description: "Enable daily SSB pack" },
    { command: "unregisterdaily", description: "Disable daily SSB pack" },
    { command: "sendtoday", description: "Send today's pack now" },
    { command: "skip", description: "Skip current practice prompt" }
  ]);

  res.status(200).json({ ok: true, bot: me.result, webhook });
};
