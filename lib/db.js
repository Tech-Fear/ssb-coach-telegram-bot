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

module.exports = {
  ensureSchema,
  upsertChat,
  listDailyChats,
  getDeliveredKeys,
  recordDeliveries,
  getOpenPracticeSession,
  createPracticeSession,
  closePracticeSession
};
