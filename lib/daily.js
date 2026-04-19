const { CONTENT } = require("./content");
const { getDeliveredKeys, recordDeliveries } = require("./db");

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

  const vocab = pickUnused(CONTENT.vocab, usedVocab, 10);
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
  const vocabLines = pack.vocab.map(
    (item, index) =>
      `${index + 1}. ${item.word}\nMeaning: ${item.meaning}\nSynonym: ${item.synonym}\nAntonym: ${item.antonym}`
  );

  const watLines = pack.wat.map(
    (item, index) => `${index + 1}. ${item.prompt}\nModel response: ${item.modelAnswer}`
  );

  const tatMessage = [
    "Daily TAT",
    `Theme: ${pack.tat.prompt}`,
    `Model story: ${pack.tat.modelAnswer}`
  ].join("\n");

  const srtMessage = [
    "Daily SRT",
    `Situation: ${pack.srt.prompt}`,
    `Model response: ${pack.srt.modelAnswer}`
  ].join("\n");

  const ppdtMessage = [
    "Daily PPDT",
    `Scene: ${pack.ppdt.prompt}`,
    `Observations: ${pack.ppdt.observations}`,
    `Model story: ${pack.ppdt.modelAnswer}`
  ].join("\n");

  return [
    `Daily Vocabulary Pack\n\n${vocabLines.join("\n\n")}`,
    `Daily WAT Pack\n\n${watLines.join("\n\n")}`,
    `${tatMessage}\n\n${srtMessage}\n\n${ppdtMessage}`
  ];
}

module.exports = {
  buildDailyPack,
  formatDailyPackMessages
};
