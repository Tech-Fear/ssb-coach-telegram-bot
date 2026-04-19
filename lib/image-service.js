function buildSceneCardUrl(title, prompt) {
  const shortPrompt = prompt.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 90).trim();
  const text = encodeURIComponent(`${title}\n${shortPrompt}`);
  return `https://dummyimage.com/1200x800/e5eef7/1f2937.png&text=${text}`;
}

function buildPollinationsUrl(kind, prompt, key) {
  const style = kind === "tat"
    ? "realistic photojournalistic scene, natural lighting, candid human action, exam prompt style"
    : "realistic situational assessment scene, candid street photography, multiple characters, exam prompt style";
  const fullPrompt = `${kind.toUpperCase()} scene, ${prompt}, ${style}, no text, no watermark`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=768&seed=${encodeURIComponent(key)}`;
}

const STATIC_IMAGE_BANK = {
  tat: [
    {
      match: ["flood", "relief", "families", "support"],
      urls: [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Flood%20Relief.jpg",
        "https://commons.wikimedia.org/wiki/Special:FilePath/Flood%20relief.jpg",
        "https://commons.wikimedia.org/wiki/Special:FilePath/Flood%20relief%20by%20volunteers.jpg"
      ]
    },
    {
      match: ["study", "school", "children", "classroom"],
      urls: [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Students%20in%20classroom.jpg",
        "https://commons.wikimedia.org/wiki/Special:FilePath/Classroom%20with%20students.JPG"
      ]
    },
    {
      match: ["bus", "travel", "transport", "stand"],
      urls: [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Village%20bus-stop.jpg",
        "https://commons.wikimedia.org/wiki/Special:FilePath/City%20bus%20stop.jpg",
        "https://commons.wikimedia.org/wiki/Special:FilePath/Bus-stop.jpg"
      ]
    },
    {
      match: ["park", "community", "group", "event"],
      urls: [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Students%20in%20classroom.jpg",
        "https://commons.wikimedia.org/wiki/Special:FilePath/Bus-stop.jpg"
      ]
    }
  ],
  ppdt: [
    {
      match: ["bus", "stop", "traveler"],
      urls: [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Village%20bus-stop.jpg",
        "https://commons.wikimedia.org/wiki/Special:FilePath/City%20bus%20stop.jpg",
        "https://commons.wikimedia.org/wiki/Special:FilePath/Bus%20Stop%20%289518590379%29.jpg"
      ]
    },
    {
      match: ["school", "students", "teacher", "children"],
      urls: [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Students%20in%20classroom.jpg",
        "https://commons.wikimedia.org/wiki/Special:FilePath/Classroom%20with%20students.JPG"
      ]
    },
    {
      match: ["river", "rescue", "rope"],
      urls: [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Flood%20Relief.jpg",
        "https://commons.wikimedia.org/wiki/Special:FilePath/Flood%20relief%20by%20volunteers.jpg"
      ]
    },
    {
      match: ["village", "community", "meeting"],
      urls: [
        "https://commons.wikimedia.org/wiki/Special:FilePath/Village%20bus-stop.jpg",
        "https://commons.wikimedia.org/wiki/Special:FilePath/Students%20in%20classroom.jpg"
      ]
    }
  ]
};

function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getStaticUrls(kind, prompt, key) {
  const lowered = prompt.toLowerCase();
  const groups = STATIC_IMAGE_BANK[kind] || [];
  const matched = groups.filter((group) => group.match.some((token) => lowered.includes(token)));
  const pool = (matched.length ? matched : groups).flatMap((group) => group.urls);
  if (!pool.length) return [];

  const start = hashText(key) % pool.length;
  const ordered = [];
  for (let index = 0; index < pool.length; index += 1) {
    ordered.push(pool[(start + index) % pool.length]);
  }
  return [...new Set(ordered)];
}

function buildImageCandidates(kind, prompt, key) {
  const title = kind === "tat" ? "TAT Scene" : "PPDT Scene";
  return [
    buildPollinationsUrl(kind, prompt, key),
    ...getStaticUrls(kind, prompt, key),
    buildSceneCardUrl(title, prompt)
  ];
}

module.exports = {
  buildImageCandidates,
  buildSceneCardUrl
};
