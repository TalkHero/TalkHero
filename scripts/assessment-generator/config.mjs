export const LEVEL_CONFIG = {
  A1: {
    grammar: 8,
    vocabulary: 7,
    reading: 5,
  },

  A2: {
    grammar: 8,
    vocabulary: 7,
    reading: 5,
  },

  B1: {
    grammar: 15,
    vocabulary: 15,
    reading: 10,
    cloze: 5,
    use_of_english: 5,
  },

  B2: {
    grammar: 18,
    vocabulary: 18,
    reading: 12,
    cloze: 6,
    use_of_english: 6,
  },

  C1: {
    grammar: 20,
    vocabulary: 20,
    reading: 15,
    cloze: 8,
    use_of_english: 7,
  },
};

export const SUPPORTED_LEVELS = Object.keys(LEVEL_CONFIG);

export const MAX_GENERATION_ATTEMPTS = 3;
