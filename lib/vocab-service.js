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
  "responsibility",
];
const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "from",
  "this",
  "into",
  "about",
  "than",
  "have",
  "been",
  "will",
  "your",
  "their",
  "them",
  "were",
  "which",
  "while",
]);

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

function buildFallbackSentence(word, partOfSpeech, meaning, synonym) {
  const cleanWord = titleCase(word);
  const lowerWord = word.toLowerCase();
  const hint =
    synonym && synonym !== "related"
      ? synonym
      : extractKeywords(meaning)[0] || "effective";
  const kind = (partOfSpeech || "").toLowerCase();

  // Contextual sentence patterns based on meaning keywords
  const meaningKeywords = extractKeywords(meaning);
  const primaryKeyword = meaningKeywords[0] || "practical action";

  if (kind.includes("verb")) {
    return `A good leader will ${lowerWord} team members to take initiative and achieve their goals.`;
  }
  if (kind.includes("noun")) {
    return `A ${cleanWord} is required before proceeding with any important decision or task.`;
  }
  if (kind.includes("adjective")) {
    // Generate better adjective sentences
    if (lowerWord.includes("dic") || lowerWord.includes("struct")) {
      return `The ${lowerWord} approach to teaching ensures that students understand the material thoroughly.`;
    }
    if (lowerWord.includes("ami") || lowerWord.includes("kind")) {
      return `Her ${lowerWord} nature made her a trusted friend and respected leader.`;
    }
    if (lowerWord.includes("resil") || lowerWord.includes("tough")) {
      return `The team showed a ${lowerWord} spirit despite facing unexpected challenges.`;
    }
    return `The manager's ${lowerWord} demeanor created a positive and productive work environment.`;
  }
  if (kind.includes("adverb")) {
    return `The team ${lowerWord} completed the project on time with excellent quality.`;
  }

  return `${cleanWord} plays an important role in developing strong character and professional success.`;
}

async function fetchDictionaryEntry(word) {
  try {
    const entries = await fetchJson(
      `${DICTIONARY_BASE}/${encodeURIComponent(word.toLowerCase())}`,
    );
    if (!Array.isArray(entries) || !entries.length) return null;

    const entry = entries[0];
    for (const meaning of entry.meanings || []) {
      const definitionBlock = meaning.definitions?.find(
        (item) => item.definition,
      );
      if (!definitionBlock) continue;
      return {
        partOfSpeech: meaning.partOfSpeech || "Word",
        meaning: definitionBlock.definition,
        example:
          definitionBlock.example ||
          buildFallbackSentence(
            word,
            meaning.partOfSpeech,
            definitionBlock.definition,
            definitionBlock.synonyms?.[0] || meaning.synonyms?.[0],
          ),
        synonym: definitionBlock.synonyms?.[0] || meaning.synonyms?.[0] || null,
        antonym: definitionBlock.antonyms?.[0] || meaning.antonyms?.[0] || null,
        meaningKeywords: extractKeywords(definitionBlock.definition),
      };
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchDatamuseWordList(topic) {
  try {
    const rows = await fetchJson(
      `${DATAMUSE_BASE}?ml=${encodeURIComponent(topic)}&max=25`,
    );
    return rows
      .map((row) => row.word)
      .filter(
        (word) =>
          /^[a-zA-Z-]+$/.test(word) && word.length >= 4 && word.length <= 12,
      )
      .map((word) => word.toLowerCase());
  } catch {
    return [];
  }
}

async function fetchDatamuseRelation(word, relation) {
  try {
    const rows = await fetchJson(
      `${DATAMUSE_BASE}?rel_${relation}=${encodeURIComponent(word.toLowerCase())}&max=5`,
    );
    return rows.find((row) => /^[a-zA-Z-]+$/.test(row.word))?.word || null;
  } catch {
    return null;
  }
}

async function fetchHindiTranslation(word) {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|hi`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!response.ok) return null;
    const data = await response.json();
    const translation = data?.responseData?.translatedText;
    return translation && translation.toLowerCase() !== word.toLowerCase()
      ? translation
      : null;
  } catch {
    return null;
  }
}

async function fetchExampleSentence(word) {
  try {
    const response = await fetch(
      `https://www.wordsapi.com/words/${encodeURIComponent(word.toLowerCase())}/examples`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.examples?.[0] || null;
  } catch {
    return null;
  }
}

async function enrichVocabItem(item) {
  const dictionary = await fetchDictionaryEntry(item.word);
  const synonym =
    dictionary?.synonym ||
    item.synonym ||
    (await fetchDatamuseRelation(item.word, "syn")) ||
    "related";
  const antonym =
    dictionary?.antonym ||
    item.antonym ||
    (await fetchDatamuseRelation(item.word, "ant")) ||
    "opposite";
  const partOfSpeech = dictionary?.partOfSpeech || item.partOfSpeech || "Word";
  const meaning =
    dictionary?.meaning ||
    item.meaning ||
    `A useful English word related to ${item.word.toLowerCase()}.`;

  let hindiMeaning = item.hindiMeaning || null;
  if (!hindiMeaning) {
    hindiMeaning = await fetchHindiTranslation(item.word);
  }

  return {
    ...item,
    partOfSpeech,
    meaning,
    hindiMeaning,
    example:
      dictionary?.example ||
      (await fetchExampleSentence(item.word)) ||
      item.example ||
      buildFallbackSentence(item.word, partOfSpeech, meaning, synonym),
    synonym,
    antonym,
    meaningKeywords: dictionary?.meaningKeywords?.length
      ? dictionary.meaningKeywords
      : item.meaningKeywords || extractKeywords(meaning || item.word),
  };
}

async function enrichVocabItems(items) {
  return Promise.all(items.map((item) => enrichVocabItem(item)));
}

async function getVocabPool() {
  const dynamicWords = new Set();
  const shuffledTopics = [...VOCAB_TOPICS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

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
    word: titleCase(word),
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
  enrichVocabItems,
};
