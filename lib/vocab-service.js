const { CONTENT } = require("./content");

const DATAMUSE_BASE = "https://api.datamuse.com/words";
const DICTIONARY_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
const VOCAB_TOPICS = [
  "leadership",
  "discipline",
  "courage",
  "service",
  "integrity",
  "teamwork",
  "learning",
  "fitness",
  "resilience",
  "judgment",
  "planning",
  "responsibility"
];
const STOPWORDS = new Set(["the", "and", "for", "with", "that", "from", "this", "into", "about", "than", "have", "been", "will", "your", "their", "them", "were", "which", "while"]);

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function extractKeywords(definition) {
  return (definition || "")
    .toLowerCase()
    .replace(/[^a-z ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word))
    .slice(0, 4);
}

async function fetchDictionaryEntry(word) {
  try {
    const entries = await fetchJson(`${DICTIONARY_BASE}/${encodeURIComponent(word.toLowerCase())}`);
    if (!Array.isArray(entries) || !entries.length) return null;

    const entry = entries[0];
    for (const meaning of entry.meanings || []) {
      const definitionBlock = meaning.definitions?.find((item) => item.definition);
      if (!definitionBlock) continue;
      return {
        partOfSpeech: meaning.partOfSpeech || "Word",
        meaning: definitionBlock.definition,
        example: definitionBlock.example || `The word ${word} can be used in a practical sentence to explain its meaning.`,
        synonym: definitionBlock.synonyms?.[0] || meaning.synonyms?.[0] || null,
        antonym: definitionBlock.antonyms?.[0] || meaning.antonyms?.[0] || null,
        meaningKeywords: extractKeywords(definitionBlock.definition)
      };
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchDatamuseWordList(topic) {
  try {
    const rows = await fetchJson(`${DATAMUSE_BASE}?ml=${encodeURIComponent(topic)}&max=25`);
    return rows
      .map((row) => row.word)
      .filter((word) => /^[a-zA-Z-]+$/.test(word) && word.length >= 4 && word.length <= 12)
      .map((word) => word.toLowerCase());
  } catch {
    return [];
  }
}

async function fetchDatamuseRelation(word, relation) {
  try {
    const rows = await fetchJson(`${DATAMUSE_BASE}?rel_${relation}=${encodeURIComponent(word.toLowerCase())}&max=5`);
    return rows.find((row) => /^[a-zA-Z-]+$/.test(row.word))?.word || null;
  } catch {
    return null;
  }
}

async function enrichVocabItem(item) {
  const dictionary = await fetchDictionaryEntry(item.word);
  const synonym = dictionary?.synonym || item.synonym || (await fetchDatamuseRelation(item.word, "syn")) || "related";
  const antonym = dictionary?.antonym || item.antonym || (await fetchDatamuseRelation(item.word, "ant")) || "opposite";

  return {
    ...item,
    partOfSpeech: dictionary?.partOfSpeech || item.partOfSpeech || "Word",
    meaning: dictionary?.meaning || item.meaning || `A useful English word related to ${item.word.toLowerCase()}.`,
    example: dictionary?.example || item.example || `${item.word} can be used in a practical sentence to show its meaning.`,
    synonym,
    antonym,
    meaningKeywords: dictionary?.meaningKeywords?.length ? dictionary.meaningKeywords : item.meaningKeywords || extractKeywords(dictionary?.meaning || item.meaning || item.word)
  };
}

async function enrichVocabItems(items) {
  return Promise.all(items.map((item) => enrichVocabItem(item)));
}

async function getVocabPool() {
  const dynamicWords = new Set();
  const shuffledTopics = [...VOCAB_TOPICS].sort(() => Math.random() - 0.5).slice(0, 5);

  for (const topic of shuffledTopics) {
    const words = await fetchDatamuseWordList(topic);
    for (const word of words) {
      dynamicWords.add(word);
      if (dynamicWords.size >= 120) break;
    }
    if (dynamicWords.size >= 120) break;
  }

  const dynamicPool = [...dynamicWords].map((word) => ({
    key: `vocab-${word}`,
    type: "vocab",
    word: titleCase(word)
  }));

  const fallbackPool = (CONTENT.vocab || []).map((item) => ({ ...item }));
  const seen = new Set(dynamicPool.map((item) => item.key));
  for (const item of fallbackPool) {
    if (!seen.has(item.key)) {
      dynamicPool.push(item);
      seen.add(item.key);
    }
  }

  return dynamicPool;
}

module.exports = {
  getVocabPool,
  enrichVocabItem,
  enrichVocabItems
};
