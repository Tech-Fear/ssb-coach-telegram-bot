const { neon } = require("@neondatabase/serverless");

let sql;

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  if (!sql) {
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

function normalizeJsonField(value) {
  if (value && typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

async function ensureSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS chats (
      chat_id BIGINT PRIMARY KEY,
      chat_type TEXT,
      title TEXT,
      username TEXT,
      daily_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS deliveries (
      id BIGSERIAL PRIMARY KEY,
      chat_id BIGINT NOT NULL,
      item_type TEXT NOT NULL,
      item_key TEXT NOT NULL,
      delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (chat_id, item_type, item_key)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id BIGSERIAL PRIMARY KEY,
      chat_id BIGINT NOT NULL,
      prompt_type TEXT NOT NULL,
      item_key TEXT NOT NULL,
      payload JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      user_answer TEXT,
      evaluation JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      answered_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS current_affair_windows (
      chat_id BIGINT PRIMARY KEY,
      last_window_end TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS current_affair_jobs (
      id BIGSERIAL PRIMARY KEY,
      chat_id BIGINT NOT NULL,
      window_start TIMESTAMPTZ NOT NULL,
      window_end TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempt_count INTEGER NOT NULL DEFAULT 0,
      next_retry_at TIMESTAMPTZ,
      last_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (chat_id, window_start, window_end)
    )
  `;
}

async function upsertChat(chat) {
  const sql = getSql();
  const dailyEnabled = typeof chat.dailyEnabled === "boolean" ? chat.dailyEnabled : null;
  await sql`
    INSERT INTO chats (chat_id, chat_type, title, username, daily_enabled, updated_at)
    VALUES (
      ${chat.id},
      ${chat.type || null},
      ${chat.title || null},
      ${chat.username || null},
      ${dailyEnabled ?? false},
      NOW()
    )
    ON CONFLICT (chat_id) DO UPDATE
    SET
      chat_type = COALESCE(EXCLUDED.chat_type, chats.chat_type),
      title = COALESCE(EXCLUDED.title, chats.title),
      username = COALESCE(EXCLUDED.username, chats.username),
      daily_enabled = COALESCE(${dailyEnabled}, chats.daily_enabled),
      updated_at = NOW()
  `;
}

async function listDailyChats() {
  const sql = getSql();
  return sql`SELECT chat_id FROM chats WHERE daily_enabled = TRUE`;
}

async function getDeliveredKeys(chatId, itemType) {
  const sql = getSql();
  const rows = await sql`
    SELECT item_key
    FROM deliveries
    WHERE chat_id = ${chatId}
      AND item_type = ${itemType}
  `;
  return rows.map((row) => row.item_key);
}

async function recordDeliveries(chatId, itemType, itemKeys) {
  const sql = getSql();
  for (const itemKey of itemKeys) {
    await sql`
      INSERT INTO deliveries (chat_id, item_type, item_key)
      VALUES (${chatId}, ${itemType}, ${itemKey})
      ON CONFLICT (chat_id, item_type, item_key) DO NOTHING
    `;
  }
}

async function getOpenPracticeSession(chatId) {
  const sql = getSql();
  const rows = await sql`
    SELECT *
    FROM practice_sessions
    WHERE chat_id = ${chatId}
      AND status = 'open'
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!rows.length) return null;
  return {
    ...rows[0],
    payload: normalizeJsonField(rows[0].payload),
    evaluation: normalizeJsonField(rows[0].evaluation)
  };
}

async function createPracticeSession(chatId, promptType, itemKey, payload) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO practice_sessions (chat_id, prompt_type, item_key, payload)
    VALUES (${chatId}, ${promptType}, ${itemKey}, ${JSON.stringify(payload)}::jsonb)
    RETURNING *
  `;

  return {
    ...rows[0],
    payload: normalizeJsonField(rows[0].payload)
  };
}

async function closePracticeSession(id, userAnswer, evaluation) {
  const sql = getSql();
  const rows = await sql`
    UPDATE practice_sessions
    SET
      status = 'closed',
      user_answer = ${userAnswer},
      evaluation = ${JSON.stringify(evaluation)}::jsonb,
      answered_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return {
    ...rows[0],
    payload: normalizeJsonField(rows[0].payload),
    evaluation: normalizeJsonField(rows[0].evaluation)
  };
}

async function getLastCurrentAffairWindowEnd(chatId) {
  const sql = getSql();
  const rows = await sql`
    SELECT last_window_end
    FROM current_affair_windows
    WHERE chat_id = ${chatId}
    LIMIT 1
  `;
  return rows[0]?.last_window_end || null;
}

async function setLastCurrentAffairWindowEnd(chatId, windowEnd) {
  const sql = getSql();
  await sql`
    INSERT INTO current_affair_windows (chat_id, last_window_end, updated_at)
    VALUES (${chatId}, ${windowEnd.toISOString()}, NOW())
    ON CONFLICT (chat_id) DO UPDATE
    SET last_window_end = EXCLUDED.last_window_end,
        updated_at = NOW()
  `;
}

async function getOrCreateCurrentAffairJob(chatId, windowStart, windowEnd) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO current_affair_jobs (chat_id, window_start, window_end, status, attempt_count, next_retry_at, updated_at)
    VALUES (${chatId}, ${windowStart.toISOString()}, ${windowEnd.toISOString()}, 'pending', 0, NOW(), NOW())
    ON CONFLICT (chat_id, window_start, window_end) DO UPDATE
    SET updated_at = NOW()
    RETURNING *
  `;
  return rows[0];
}

async function markCurrentAffairJobSuccess(id) {
  const sql = getSql();
  const rows = await sql`
    UPDATE current_affair_jobs
    SET status = 'success',
        next_retry_at = NULL,
        last_error = NULL,
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

async function markCurrentAffairJobFailure(id, attemptCount, errorMessage, nextRetryAt, status) {
  const sql = getSql();
  const rows = await sql`
    UPDATE current_affair_jobs
    SET status = ${status},
        attempt_count = ${attemptCount},
        last_error = ${errorMessage},
        next_retry_at = ${nextRetryAt ? nextRetryAt.toISOString() : null},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

async function listDueCurrentAffairJobs() {
  const sql = getSql();
  return sql`
    SELECT *
    FROM current_affair_jobs
    WHERE status = 'pending'
      AND next_retry_at IS NOT NULL
      AND next_retry_at <= NOW()
    ORDER BY next_retry_at ASC
  `;
}

module.exports = {
  ensureSchema,
  upsertChat,
  listDailyChats,
  getDeliveredKeys,
  recordDeliveries,
  getOpenPracticeSession,
  createPracticeSession,
  closePracticeSession,
  getLastCurrentAffairWindowEnd,
  setLastCurrentAffairWindowEnd,
  getOrCreateCurrentAffairJob,
  markCurrentAffairJobSuccess,
  markCurrentAffairJobFailure,
  listDueCurrentAffairJobs
};
