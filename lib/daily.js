const { CONTENT } = require("./content");
const { getDeliveredKeys, recordDeliveries } = require("./db");
const { getVocabPool, enrichVocabItems } = require("./vocab-service");

function buildSceneImageUrl(title, prompt) {
  const shortPrompt = prompt.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 70).trim();
  const text = encodeURIComponent(`${title}\n${shortPrompt}`);
  return `https://dummyimage.com/1200x800/e5eef7/1f2937.png&text=${text}`;
}

function pickUnused(items, usedKeys, count) {
  const unused = items.filter((item) => !usedKeys.has(item.key));
  if (unused.length < count) {
    throw new Error(`Not enough unused ${items[0]?.type || "items"} left. Add more content to continue without repeats.`);
  }

  const shuffled = [...unused].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function buildDailyPack(chatId) {
  const usedVocab = new Set(await getDeliveredKeys(chatId, "vocab"));
  const usedWat = new Set(await getDeliveredKeys(chatId, "wat"));
  const usedTat = new Set(await getDeliveredKeys(chatId, "tat"));
  const usedSrt = new Set(await getDeliveredKeys(chatId, "srt"));
  const usedPpdt = new Set(await getDeliveredKeys(chatId, "ppdt"));

  const vocabPool = await getVocabPool();
  const vocabSeeds = pickUnused(vocabPool, usedVocab, 10);
  const vocab = await enrichVocabItems(vocabSeeds);
  const wat = pickUnused(CONTENT.wat, usedWat, 10);
  const tat = pickUnused(CONTENT.tat, usedTat, 1);
  const srt = pickUnused(CONTENT.srt, usedSrt, 1);
  const ppdt = pickUnused(CONTENT.ppdt, usedPpdt, 1);

  await recordDeliveries(chatId, "vocab", vocab.map((item) => item.key));
  await recordDeliveries(chatId, "wat", wat.map((item) => item.key));
  await recordDeliveries(chatId, "tat", tat.map((item) => item.key));
  await recordDeliveries(chatId, "srt", srt.map((item) => item.key));
  await recordDeliveries(chatId, "ppdt", ppdt.map((item) => item.key));

  return { vocab, wat, tat: tat[0], srt: srt[0], ppdt: ppdt[0] };
}

function formatDailyPackMessages(pack) {
  const vocabLines = pack.vocab.map((item, index) => {
    return [
      `${index + 1}. ${item.word}`,
      `Part of speech: ${item.partOfSpeech || "Word"}`,
      `Meaning: ${item.meaning}`,
      `Synonym: ${item.synonym}`,
      `Antonym: ${item.antonym}`,
      `Example: ${item.example}`
    ].join("\n");
  });

  const watLines = pack.wat.map(
    (item, index) => `${index + 1}. ${item.prompt}\nModel response: ${item.modelAnswer}`
  );

  const tatCaption = [
    "Daily TAT",
    `Theme: ${pack.tat.prompt}`,
    `Model story: ${pack.tat.modelAnswer}`
  ].join("\n");

  const srtMessage = [
    "Daily SRT",
    `Situation: ${pack.srt.prompt}`,
    `Model response: ${pack.srt.modelAnswer}`
  ].join("\n");

  const ppdtCaption = [
    "Daily PPDT",
    `Scene: ${pack.ppdt.prompt}`,
    `Observations: ${pack.ppdt.observations}`,
    `Model story: ${pack.ppdt.modelAnswer}`
  ].join("\n");

  return [
    { type: "text", text: `Daily Vocabulary Pack\n\n${vocabLines.join("\n\n")}` },
    { type: "text", text: `Daily WAT Pack\n\n${watLines.join("\n\n")}` },
    { type: "photo", photoUrl: buildSceneImageUrl("TAT Scene", pack.tat.prompt), caption: tatCaption },
    { type: "text", text: srtMessage },
    { type: "photo", photoUrl: buildSceneImageUrl("PPDT Scene", pack.ppdt.prompt), caption: ppdtCaption }
  ];
}

module.exports = {
  buildDailyPack,
  formatDailyPackMessages
};
