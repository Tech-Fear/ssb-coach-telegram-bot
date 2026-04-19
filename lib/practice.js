const { CONTENT } = require("./content");
const { getDeliveredKeys, recordDeliveries, createPracticeSession } = require("./db");

function scoreOverlap(answer, expectedPhrases) {
  const lowered = answer.toLowerCase();
  return expectedPhrases.filter((phrase) => lowered.includes(phrase.toLowerCase())).length;
}

function toSentenceList(text) {
  return text
    .split(/[.!?]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function pickUnused(items, usedKeys) {
  const unused = items.filter((item) => !usedKeys.has(item.key));
  if (!unused.length) {
    throw new Error("This practice pool is exhausted for this chat. Add more content to continue without repeats.");
  }
  return unused[Math.floor(Math.random() * unused.length)];
}

async function createPracticePrompt(chatId, practiceType) {
  const normalizedType = practiceType.toLowerCase();
  const bucket = CONTENT[normalizedType];
  if (!bucket) {
    throw new Error("Unknown practice type. Use vocab, wat, tat, srt, or ppdt.");
  }

  const usedKeys = new Set(await getDeliveredKeys(chatId, normalizedType));
  const item = pickUnused(bucket, usedKeys);
  await recordDeliveries(chatId, normalizedType, [item.key]);

  const payload = {
    type: normalizedType,
    key: item.key,
    prompt: item.prompt || item.word,
    expectedPoints: item.expectedPoints,
    modelAnswer: item.modelAnswer || `Meaning: ${item.meaning}\nSynonym: ${item.synonym}\nAntonym: ${item.antonym}`,
    reference: item
  };

  await createPracticeSession(chatId, normalizedType, item.key, payload);

  const messageByType = {
    vocab: [
      "Practice Vocab",
      `Word: ${item.word}`,
      "Reply with meaning, one synonym, and one antonym in a single message."
    ].join("\n"),
    wat: [
      "Practice WAT",
      `Word: ${item.prompt}`,
      "Reply with one positive, practical sentence."
    ].join("\n"),
    tat: [
      "Practice TAT",
      `Theme: ${item.prompt}`,
      "Reply with a short story covering situation, action, and outcome."
    ].join("\n"),
    srt: [
      "Practice SRT",
      `Situation: ${item.prompt}`,
      "Reply with your immediate response and responsible follow-up."
    ].join("\n"),
    ppdt: [
      "Practice PPDT",
      `Scene: ${item.prompt}`,
      "Write observations, then a short story with characters, action, and result."
    ].join("\n")
  };

  return { message: messageByType[normalizedType] };
}

function evaluateVocab(reference, answer) {
  const strengths = [];
  const missing = [];
  const improvements = [];

  const overlapMeaning = scoreOverlap(answer, reference.meaningKeywords || []);
  const overlapSynonym = scoreOverlap(answer, [reference.synonym]);
  const overlapAntonym = scoreOverlap(answer, [reference.antonym]);

  let score = 3 + overlapMeaning + overlapSynonym + overlapAntonym;
  if (/synonym/i.test(answer) || /antonym/i.test(answer) || /meaning/i.test(answer)) {
    strengths.push("You structured the answer clearly.");
    score += 1;
  }

  if (!overlapMeaning) missing.push("Meaning was missing or too far from the target sense.");
  if (!overlapSynonym) missing.push("Synonym did not match the expected sense closely enough.");
  if (!overlapAntonym) missing.push("Antonym was missing or inaccurate.");

  if (answer.length < 20) improvements.push("Give all three parts instead of a very short reply.");
  if (!missing.length) strengths.push("Meaning, synonym, and antonym were all covered.");

  return {
    score: Math.min(score, 10),
    summary: missing.length ? "Partially correct vocab response." : "Strong vocab response.",
    strengths,
    missing,
    improvements,
    betterAnswer: `Meaning: ${reference.meaning}\nSynonym: ${reference.synonym}\nAntonym: ${reference.antonym}`
  };
}

function evaluatePsych(reference, answer, type) {
  const strengths = [];
  const missing = [];
  const improvements = [];

  const sentences = toSentenceList(answer);
  const overlap = scoreOverlap(answer, reference.expectedPoints || []);
  const hasActionVerb = /\b(plan|act|help|lead|organize|complete|support|finish|inform|train|study|prepare|solve|rescue)\b/i.test(answer);
  const hasPositiveTone = !/\bcan't|cannot|failed|quit|hopeless|useless|blame\b/i.test(answer);

  let score = 4 + overlap;
  if (hasActionVerb) {
    strengths.push("Response shows action orientation.");
    score += 2;
  } else {
    missing.push("Action orientation is weak.");
  }

  if (hasPositiveTone) {
    strengths.push("Tone is constructive.");
    score += 1;
  } else {
    improvements.push("Keep the response constructive and solution-focused.");
  }

  if ((type === "tat" || type === "ppdt") && sentences.length < 3) {
    missing.push("Story needs clearer situation, action, and outcome.");
  }

  if (type === "srt" && !/\bimmediately|at once|first|then|after\b/i.test(answer)) {
    improvements.push("Show sequence: immediate action first, follow-up next.");
  }

  if (type === "wat" && sentences.length > 1) {
    improvements.push("Keep WAT to one crisp sentence.");
  }

  return {
    score: Math.min(score, 10),
    summary: missing.length ? "Good intent, but the response can be sharper." : "Solid SSB-style response.",
    strengths,
    missing,
    improvements,
    betterAnswer: reference.modelAnswer
  };
}

function evaluatePracticeReply(payload, answer) {
  const reference = payload.reference;
  if (payload.type === "vocab") {
    return evaluateVocab(reference, answer);
  }
  return evaluatePsych(reference, answer, payload.type);
}

function getPracticeHelpText() {
  return [
    "Commands",
    "/registerdaily - enable daily pack",
    "/unregisterdaily - disable daily pack",
    "/sendtoday - send today's pack now",
    "/practice vocab - vocab evaluation",
    "/practice wat - WAT evaluation",
    "/practice tat - TAT evaluation",
    "/practice srt - SRT evaluation",
    "/practice ppdt - PPDT evaluation",
    "/skip - skip current practice prompt"
  ].join("\n");
}

module.exports = {
  createPracticePrompt,
  evaluatePracticeReply,
  getPracticeHelpText
};
