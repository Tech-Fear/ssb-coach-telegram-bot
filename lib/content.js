const vocab = [
  {
    key: "vocab-1",
    type: "vocab",
    word: "Abate",
    meaning: "to become less intense or widespread",
    hindiMeaning: "कम होना, शांत करना",
    meaningKeywords: ["less", "reduce", "decrease"],
    synonym: "diminish",
    antonym: "intensify",
  },
  {
    key: "vocab-2",
    type: "vocab",
    word: "Adept",
    meaning: "highly skilled or proficient",
    hindiMeaning: "कुशल, दक्ष",
    meaningKeywords: ["skilled", "proficient", "expert"],
    synonym: "skilled",
    antonym: "clumsy",
  },
  {
    key: "vocab-3",
    type: "vocab",
    word: "Amiable",
    meaning: "friendly and pleasant",
    hindiMeaning: "मैत्रीपूर्ण, प्रिय",
    meaningKeywords: ["friendly", "pleasant", "warm"],
    synonym: "cordial",
    antonym: "hostile",
  },
  {
    key: "vocab-4",
    type: "vocab",
    word: "Arduous",
    meaning: "requiring great effort",
    hindiMeaning: "कठिन, श्रमसाध्य",
    meaningKeywords: ["difficult", "effort", "hard"],
    synonym: "strenuous",
    antonym: "easy",
  },
  {
    key: "vocab-5",
    type: "vocab",
    word: "Astute",
    meaning: "having sharp judgment",
    hindiMeaning: "चतुर, तीक्ष्ण बुद्धि वाला",
    meaningKeywords: ["clever", "shrewd", "judgment"],
    synonym: "shrewd",
    antonym: "naive",
  },
  {
    key: "vocab-6",
    type: "vocab",
    word: "Benevolent",
    meaning: "well meaning and kindly",
    hindiMeaning: "दयालु, परोपकारी",
    meaningKeywords: ["kind", "helpful", "well meaning"],
    synonym: "kindhearted",
    antonym: "malevolent",
  },
  {
    key: "vocab-7",
    type: "vocab",
    word: "Candid",
    meaning: "truthful and straightforward",
    hindiMeaning: "ईमानदार, सरल",
    meaningKeywords: ["truthful", "frank", "straightforward"],
    synonym: "frank",
    antonym: "deceptive",
  },
  {
    key: "vocab-8",
    type: "vocab",
    word: "Coherent",
    meaning: "logical and consistent",
    hindiMeaning: "सुसंगत, सामंजस्यपूर्ण",
    meaningKeywords: ["logical", "consistent", "clear"],
    synonym: "logical",
    antonym: "confused",
  },
  {
    key: "vocab-9",
    type: "vocab",
    word: "Diligent",
    meaning: "careful and hardworking",
    hindiMeaning: "मेहनती, कर्मठ",
    meaningKeywords: ["hardworking", "careful", "steady"],
    synonym: "industrious",
    antonym: "lazy",
  },
  {
    key: "vocab-10",
    type: "vocab",
    word: "Eloquent",
    meaning: "fluent and persuasive in speaking",
    hindiMeaning: "मनमोहक, वक्ता",
    meaningKeywords: ["fluent", "persuasive", "expressive"],
    synonym: "articulate",
    antonym: "inarticulate",
  },
  {
    key: "vocab-11",
    type: "vocab",
    word: "Empathy",
    meaning: "the ability to understand another person's feelings",
    hindiMeaning: "सहानुभूति, अनुकंपा",
    meaningKeywords: ["understand", "feelings", "others"],
    synonym: "compassion",
    antonym: "indifference",
  },
  {
    key: "vocab-12",
    type: "vocab",
    word: "Endeavor",
    meaning: "an earnest attempt",
    hindiMeaning: "प्रयास, कोशिश",
    meaningKeywords: ["attempt", "effort", "try"],
    synonym: "effort",
    antonym: "idleness",
  },
  {
    key: "vocab-13",
    type: "vocab",
    word: "Fortify",
    meaning: "to strengthen or secure",
    hindiMeaning: "मजबूत करना, दुर्ग बनाना",
    meaningKeywords: ["strengthen", "secure", "reinforce"],
    synonym: "reinforce",
    antonym: "weaken",
  },
  {
    key: "vocab-14",
    type: "vocab",
    word: "Frugal",
    meaning: "careful about spending resources",
    hindiMeaning: "मितव्ययी, कंजूस",
    meaningKeywords: ["economical", "careful", "saving"],
    synonym: "economical",
    antonym: "wasteful",
  },
  {
    key: "vocab-15",
    type: "vocab",
    word: "Harmony",
    meaning: "agreement or peaceful coexistence",
    hindiMeaning: "सामंजस्य, मेल",
    meaningKeywords: ["peace", "agreement", "balance"],
    synonym: "accord",
    antonym: "conflict",
  },
  {
    key: "vocab-16",
    type: "vocab",
    word: "Impeccable",
    meaning: "flawless or faultless",
    hindiMeaning: "निर्दोष, पूर्ण",
    meaningKeywords: ["flawless", "perfect", "faultless"],
    synonym: "faultless",
    antonym: "imperfect",
  },
  {
    key: "vocab-17",
    type: "vocab",
    word: "Improvise",
    meaning: "to create or perform without preparation",
    hindiMeaning: "तत्काल निर्माण, तुरंत प्रदर्शन",
    meaningKeywords: ["without preparation", "spontaneous", "adapt"],
    synonym: "extemporize",
    antonym: "rehearse",
  },
  {
    key: "vocab-18",
    type: "vocab",
    word: "Induce",
    meaning: "to bring about or persuade",
    hindiMeaning: "प्रेरित करना, राजी करना",
    meaningKeywords: ["cause", "bring about", "persuade"],
    synonym: "prompt",
    antonym: "prevent",
  },
  {
    key: "vocab-19",
    type: "vocab",
    word: "Integrity",
    meaning: "moral honesty and strong principles",
    hindiMeaning: "सत्यनिष्ठा, संपूर्णता",
    meaningKeywords: ["honesty", "principles", "uprightness"],
    synonym: "honesty",
    antonym: "corruption",
  },
  {
    key: "vocab-20",
    type: "vocab",
    word: "Keen",
    meaning: "eager or sharp",
    hindiMeaning: "तीव्र, उत्सुक",
    meaningKeywords: ["eager", "sharp", "enthusiastic"],
    synonym: "eager",
    antonym: "apathetic",
  },
  {
    key: "vocab-21",
    type: "vocab",
    word: "Meticulous",
    meaning: "showing great attention to detail",
    hindiMeaning: "सूक्ष्म, विस्तारपूर्ण",
    meaningKeywords: ["careful", "detail", "thorough"],
    synonym: "thorough",
    antonym: "careless",
  },
  {
    key: "vocab-22",
    type: "vocab",
    word: "Noble",
    meaning: "having high moral qualities",
    hindiMeaning: "उदात्त, श्रेष्ठ",
    meaningKeywords: ["moral", "honorable", "high"],
    synonym: "honorable",
    antonym: "ignoble",
  },
  {
    key: "vocab-23",
    type: "vocab",
    word: "Optimistic",
    meaning: "hopeful about the future",
    hindiMeaning: "आशावादी, आशान्वित",
    meaningKeywords: ["hopeful", "positive", "future"],
    synonym: "hopeful",
    antonym: "pessimistic",
  },
  {
    key: "vocab-24",
    type: "vocab",
    word: "Persevere",
    meaning: "to continue steadily despite difficulty",
    hindiMeaning: "दृढ़ता से चलते रहना, निरंतर प्रयास करना",
    meaningKeywords: ["continue", "persist", "difficulty"],
    synonym: "persist",
    antonym: "quit",
  },
  {
    key: "vocab-25",
    type: "vocab",
    word: "Prudent",
    meaning: "acting with care and good judgment",
    hindiMeaning: "विवेकशील, दूरदर्शी",
    meaningKeywords: ["careful", "wise", "judgment"],
    synonym: "wise",
    antonym: "reckless",
  },
  {
    key: "vocab-26",
    type: "vocab",
    word: "Resilient",
    meaning: "able to recover quickly",
    hindiMeaning: "लचीला, पुनरुद्धार योग्य",
    meaningKeywords: ["recover", "bounce back", "tough"],
    synonym: "adaptable",
    antonym: "fragile",
  },
  {
    key: "vocab-27",
    type: "vocab",
    word: "Resolve",
    meaning: "firm determination",
    hindiMeaning: "दृढ़ संकल्प, निर्णय",
    meaningKeywords: ["determination", "firmness", "decision"],
    synonym: "determination",
    antonym: "indecision",
  },
  {
    key: "vocab-28",
    type: "vocab",
    word: "Sincere",
    meaning: "genuine and honest",
    hindiMeaning: "सच्चा, ईमानदार",
    meaningKeywords: ["genuine", "honest", "true"],
    synonym: "genuine",
    antonym: "insincere",
  },
  {
    key: "vocab-29",
    type: "vocab",
    word: "Steadfast",
    meaning: "firm and unwavering",
    hindiMeaning: "स्थिर, अटल",
    meaningKeywords: ["firm", "constant", "unwavering"],
    synonym: "firm",
    antonym: "fickle",
  },
  {
    key: "vocab-30",
    type: "vocab",
    word: "Tactful",
    meaning: "sensitive in dealing with others",
    hindiMeaning: "कूटनीति पूर्ण, संवेदनशील",
    meaningKeywords: ["sensitive", "diplomatic", "careful"],
    synonym: "diplomatic",
    antonym: "rude",
  },
  {
    key: "vocab-31",
    type: "vocab",
    word: "Vigilant",
    meaning: "carefully watchful to avoid danger",
    hindiMeaning: "सचेत, जागरूक",
    meaningKeywords: ["watchful", "alert", "careful"],
    synonym: "alert",
    antonym: "careless",
  },
  {
    key: "vocab-32",
    type: "vocab",
    word: "Zealous",
    meaning: "showing great energy or enthusiasm",
    hindiMeaning: "उत्साही, जोशीला",
    meaningKeywords: ["enthusiastic", "energetic", "eager"],
    synonym: "enthusiastic",
    antonym: "apathetic",
  },
  {
    key: "vocab-33",
    type: "vocab",
    word: "Pragmatic",
    meaning: "dealing with things realistically",
    hindiMeaning: "व्यावहारिक, यथार्थवादी",
    meaningKeywords: ["practical", "realistic", "sensible"],
    synonym: "practical",
    antonym: "idealistic",
  },
  {
    key: "vocab-34",
    type: "vocab",
    word: "Tenacious",
    meaning: "tending to keep a firm hold",
    hindiMeaning: "जिद्दी, दृढ़",
    meaningKeywords: ["persistent", "firm", "determined"],
    synonym: "persistent",
    antonym: "weak",
  },
  {
    key: "vocab-35",
    type: "vocab",
    word: "Lucid",
    meaning: "expressed clearly and easy to understand",
    hindiMeaning: "स्पष्ट, समझने योग्य",
    meaningKeywords: ["clear", "understandable", "coherent"],
    synonym: "clear",
    antonym: "unclear",
  },
  {
    key: "vocab-36",
    type: "vocab",
    word: "Judicious",
    meaning: "having good judgment",
    hindiMeaning: "विवेकशील, बुद्धिमान",
    meaningKeywords: ["wise", "sensible", "judgment"],
    synonym: "wise",
    antonym: "foolish",
  },
  {
    key: "vocab-37",
    type: "vocab",
    word: "Intrepid",
    meaning: "fearless and adventurous",
    hindiMeaning: "निडर, साहसी",
    meaningKeywords: ["fearless", "brave", "adventurous"],
    synonym: "brave",
    antonym: "timid",
  },
  {
    key: "vocab-38",
    type: "vocab",
    word: "Humble",
    meaning: "having a modest view of oneself",
    hindiMeaning: "विनम्र, नम्र",
    meaningKeywords: ["modest", "unassuming", "simple"],
    synonym: "modest",
    antonym: "arrogant",
  },
  {
    key: "vocab-39",
    type: "vocab",
    word: "Gallant",
    meaning: "brave and noble",
    hindiMeaning: "वीर, साहसी",
    meaningKeywords: ["brave", "noble", "chivalrous"],
    synonym: "valiant",
    antonym: "cowardly",
  },
  {
    key: "vocab-40",
    type: "vocab",
    word: "Discern",
    meaning: "to recognize or understand",
    hindiMeaning: "समझना, पहचानना",
    meaningKeywords: ["recognize", "understand", "detect"],
    synonym: "perceive",
    antonym: "overlook",
  },
];

function buildWat() {
  const themes = [
    {
      topic: "Discipline",
      focus: ["consistency", "self-control", "growth"],
      action: "staying regular",
    },
    {
      topic: "Leadership",
      focus: ["initiative", "team", "responsibility"],
      action: "guiding people",
    },
    {
      topic: "Failure",
      focus: ["learning", "improvement", "retry"],
      action: "reviewing mistakes",
    },
    {
      topic: "Courage",
      focus: ["action", "fear", "rightness"],
      action: "doing the right thing",
    },
    {
      topic: "Service",
      focus: ["help", "society", "purpose"],
      action: "helping others",
    },
    {
      topic: "Focus",
      focus: ["priority", "clarity", "results"],
      action: "protecting attention",
    },
    {
      topic: "Teamwork",
      focus: ["trust", "cooperation", "goal"],
      action: "working together",
    },
    {
      topic: "Integrity",
      focus: ["honesty", "character", "trust"],
      action: "choosing what is right",
    },
    {
      topic: "Pressure",
      focus: ["calm", "priorities", "performance"],
      action: "thinking clearly",
    },
    {
      topic: "Initiative",
      focus: ["ownership", "action", "start"],
      action: "acting without waiting",
    },
    {
      topic: "Patriotism",
      focus: ["nation", "duty", "conduct"],
      action: "serving responsibly",
    },
    {
      topic: "Confidence",
      focus: ["preparation", "belief", "performance"],
      action: "preparing thoroughly",
    },
  ];
  const openings = [
    "{topic} grows stronger through {action}.",
    "Real {topic} appears when we keep {action} under pressure.",
    "{topic} becomes meaningful when it is linked with {focus0} and {focus1}.",
    "A person develops {topic} by practicing {action} every day.",
    "True {topic} is visible in conduct, not in words alone.",
  ];
  const secondLines = [
    "It reflects {focus0}, {focus1}, and readiness for responsibility.",
    "That attitude builds {focus0} and creates lasting results.",
    "Such thinking shows maturity, purpose, and an officer-like mindset.",
    "It helps a person stay useful to the team and the mission.",
    "This outlook turns thought into practical action.",
  ];
  const items = [];
  let id = 1;
  for (const theme of themes) {
    for (const opening of openings) {
      for (const secondLine of secondLines) {
        const first = opening
          .replaceAll("{topic}", theme.topic)
          .replaceAll("{action}", theme.action)
          .replaceAll("{focus0}", theme.focus[0])
          .replaceAll("{focus1}", theme.focus[1]);
        const second = secondLine
          .replaceAll("{topic}", theme.topic)
          .replaceAll("{action}", theme.action)
          .replaceAll("{focus0}", theme.focus[0])
          .replaceAll("{focus1}", theme.focus[1]);
        items.push({
          key: `wat-${id++}`,
          type: "wat",
          prompt: theme.topic,
          expectedPoints: theme.focus,
          modelAnswer: `${first} ${second}`,
        });
      }
    }
  }
  return items;
}

function buildTat() {
  const heroes = [
    { name: "Aman", role: "college volunteer" },
    { name: "Riya", role: "NCC cadet" },
    { name: "Karan", role: "student leader" },
    { name: "Neha", role: "social worker" },
    { name: "Arjun", role: "trek participant" },
  ];
  const settings = [
    {
      place: "college campus",
      issue: "students were confused by a sudden schedule change",
      firstAction: "understood the problem quickly and calmed those around him",
      secondAction:
        "organized a short briefing and divided responsibilities clearly",
      result: "the event continued smoothly",
    },
    {
      place: "village",
      issue: "children lacked a clean place to study",
      firstAction:
        "discussed the issue with local residents and identified an unused room",
      secondAction: "mobilized people to clean and arrange the space",
      result: "a study center began functioning regularly",
    },
    {
      place: "flood-affected locality",
      issue: "families needed immediate support",
      firstAction: "assessed the urgency and coordinated nearby people calmly",
      secondAction: "shifted vulnerable residents and informed the authorities",
      result: "everyone reached safety in time",
    },
    {
      place: "sports camp",
      issue: "a junior had lost confidence after repeated errors",
      firstAction: "spoke to the junior with patience and rebuilt confidence",
      secondAction:
        "included the junior in practice and guided him step by step",
      result: "his confidence and performance improved",
    },
    {
      place: "community park",
      issue: "the area had become dirty and unsafe",
      firstAction: "took initiative to gather support from residents",
      secondAction:
        "planned a cleanliness drive and arranged follow-up maintenance",
      result: "the park became usable again",
    },
    {
      place: "blood donation drive",
      issue: "participation was low due to hesitation",
      firstAction: "spoke to students and addressed common doubts",
      secondAction: "organized volunteers and simplified the process",
      result: "turnout increased significantly",
    },
    {
      place: "bus stand",
      issue: "travelers were anxious after a transport disruption",
      firstAction:
        "collected correct information and reassured the waiting passengers",
      secondAction:
        "organized alternatives and guided people according to priority",
      result: "most people reached their destinations on time",
    },
  ];
  const items = [];
  let id = 1;
  for (const hero of heroes) {
    for (const setting of settings) {
      items.push({
        key: `tat-${id++}`,
        type: "tat",
        prompt: `A ${hero.role} is at a ${setting.place} where ${setting.issue}.`,
        expectedPoints: ["notice", "organize", "help", "outcome"],
        modelAnswer: `${hero.name}, a ${hero.role}, noticed that ${setting.issue}. ${hero.name} ${setting.firstAction}, then ${setting.secondAction}. As a result, ${setting.result}.`,
      });
    }
  }
  return items;
}

function buildSrt() {
  const situations = [
    {
      trigger: "you witness a road accident",
      immediate: "ensure safety and call emergency help",
      followUp: "organize nearby support and inform the concerned authority",
    },
    {
      trigger: "your team misses a deadline",
      immediate: "assess the unfinished work and take ownership",
      followUp: "recover the task and set checkpoints to prevent repetition",
    },
    {
      trigger: "you lose your wallet while traveling",
      immediate: "stay calm, retrace steps, and block cards",
      followUp: "inform the proper desk and arrange safe temporary support",
    },
    {
      trigger: "you are given an unfamiliar task with little time",
      immediate: "clarify the expected output and prioritize essentials",
      followUp: "learn fast and deliver a workable solution on time",
    },
    {
      trigger: "heavy rain disrupts an event you organized",
      immediate: "move people to safety and activate the backup plan",
      followUp: "communicate clearly and review improvements later",
    },
    {
      trigger: "a friend asks you to spread an unverified rumor",
      immediate: "refuse firmly and avoid harming anyone unfairly",
      followUp: "encourage responsible verification if the matter is serious",
    },
    {
      trigger: "a younger sibling wants to quit after repeated failure",
      immediate: "encourage and calm the person first",
      followUp: "analyze the cause and create a smaller improvement plan",
    },
    {
      trigger: "two seniors resist cooperating with you in a group task",
      immediate: "speak respectfully and clarify the common goal",
      followUp: "assign roles fairly and earn cooperation through action",
    },
  ];
  const items = situations.map((situation, index) => ({
    key: `srt-${index + 1}`,
    type: "srt",
    prompt: `If ${situation.trigger}, what will you do?`,
    expectedPoints: ["calm", "action", "responsibility", "follow-up"],
    modelAnswer: `I would first ${situation.immediate}. Then I would ${situation.followUp}.`,
  }));

  const variations = [];
  let id = items.length + 1;
  for (const first of situations) {
    for (const second of situations) {
      if (first.trigger === second.trigger) continue;
      variations.push({
        key: `srt-${id++}`,
        type: "srt",
        prompt: `If ${first.trigger} while you are already under pressure, what will you do?`,
        expectedPoints: ["calm", "action", "priority", "responsibility"],
        modelAnswer: `I would remain calm, ${first.immediate}, and avoid panic. After stabilizing the immediate situation, I would ${second.followUp}.`,
      });
      if (variations.length >= 40) return items.concat(variations);
    }
  }
  return items.concat(variations);
}

function buildPpdt() {
  const actors = [
    { label: "a student leader", name: "Rahul" },
    { label: "an NCC cadet", name: "Aditi" },
    { label: "a village youth", name: "Sandeep" },
    { label: "a volunteer", name: "Meera" },
    { label: "a young teacher", name: "Kavya" },
  ];
  const places = [
    "near a community hall",
    "beside a roadside workshop",
    "outside a school building",
    "at a bus stop",
    "near a riverbank",
  ];
  const situations = [
    {
      cue: "guiding a small group after confusion",
      context:
        "people were uncertain about what to do next and were waiting for someone to take initiative",
      firstAction:
        "quickly understood the situation and spoke calmly to the group",
      secondAction:
        "assigned simple responsibilities, clarified the immediate objective, and ensured everyone stayed coordinated",
      outcome:
        "within a short time the confusion reduced, work became organized, and the group regained confidence",
    },
    {
      cue: "helping after a minor breakdown",
      context:
        "movement had stopped and nearby people were worried about delay and inconvenience",
      firstAction:
        "checked the problem carefully and made sure the surroundings were safe",
      secondAction:
        "arranged the basic tools available, involved nearby people helpfully, and focused on a practical temporary solution",
      outcome:
        "the issue was managed without panic and normal activity resumed smoothly",
    },
    {
      cue: "addressing a community need",
      context:
        "the local people had been facing a repeated difficulty but had not yet organized a practical response",
      firstAction:
        "listened to the concern, identified the most urgent need, and proposed an achievable plan",
      secondAction:
        "gathered support from others, divided tasks clearly, and personally supervised the first steps of the solution",
      outcome:
        "the community responded positively, progress started quickly, and people became more confident about solving the issue together",
    },
    {
      cue: "assisting a traveler in difficulty",
      context:
        "the person looked confused and needed timely guidance to avoid missing an important connection",
      firstAction:
        "approached confidently, verified the problem, and reassured the person",
      secondAction:
        "checked the correct information, helped with movement where needed, and directed the traveler to the proper place",
      outcome:
        "the traveler avoided delay and the situation was resolved in an orderly way",
    },
    {
      cue: "organizing a small awareness activity",
      context:
        "a few people were present but there was no structure, so the activity risked becoming ineffective",
      firstAction:
        "briefed the group on the purpose and created immediate clarity",
      secondAction:
        "delegated speaking, logistics, and coordination tasks, then monitored progress and encouraged participation",
      outcome:
        "the activity was completed effectively and the group felt motivated by the result",
    },
  ];
  const items = [];
  let id = 1;
  for (const actor of actors) {
    for (const place of places) {
      for (const situation of situations) {
        items.push({
          key: `ppdt-${id++}`,
          type: "ppdt",
          prompt: `${actor.label} ${place}, ${situation.cue}.`,
          observations: `Likely a daytime public or semi-public setting. One central character appears ready to act, a few supporting characters are present, and the scene suggests a manageable practical problem requiring calm initiative.`,
          expectedPoints: ["observe", "initiative", "teamwork", "result"],
          modelAnswer: `${actor.name} was ${actor.label} ${place}. On seeing that ${situation.context}, ${actor.name} ${situation.firstAction}. After understanding what was required, ${actor.name} ${situation.secondAction}. Because the response was timely, calm, and purposeful, ${situation.outcome}.`,
        });
      }
    }
  }
  return items;
}

const CONTENT = {
  vocab,
  wat: buildWat(),
  tat: buildTat(),
  srt: buildSrt(),
  ppdt: buildPpdt(),
};

module.exports = { CONTENT };
