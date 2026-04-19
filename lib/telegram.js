const apiBase = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

async function callTelegram(method, payload) {
  const response = await fetch(`${apiBase}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(json.description || `Telegram API call failed for ${method}`);
  }
  return json;
}

async function sendMessage(chatId, text) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true
  });
}

async function sendPhoto(chatId, photoUrl, caption) {
  return callTelegram("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    disable_notification: false
  });
}

async function setWebhook(url, secretToken) {
  const payload = { url };
  if (secretToken) payload.secret_token = secretToken;
  return callTelegram("setWebhook", payload);
}

async function setCommands(commands) {
  return callTelegram("setMyCommands", { commands });
}

async function getMe() {
  return callTelegram("getMe", {});
}

module.exports = {
  sendMessage,
  sendPhoto,
  setWebhook,
  setCommands,
  getMe
};
