const { ensureSchema } = require("../../lib/db");
const { retryDueCurrentAffairJobs } = require("../../lib/current-affairs");

module.exports = async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ ok: false });
    return;
  }

  await ensureSchema();
  const results = await retryDueCurrentAffairJobs();
  res.status(200).json({ ok: true, count: results.length, results });
};
