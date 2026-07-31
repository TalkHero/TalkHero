export function getQuestionType(category) {
  return category === "reading"
    ? "reading_choice"
    : "multiple_choice";
}

export function getTotalQuestionCount(config) {
  return Object.values(config).reduce(
    (total, count) => total + count,
    0,
  );
}

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .toLowerCase();
}

export function parseGeneratorArgs(argv, supportedLevels) {
  const args = argv.slice(2);
  const levelIndex = args.indexOf("--level");

  if (levelIndex === -1 || !args[levelIndex + 1]) {
    throw new Error(
      `Missing required argument --level. Supported levels: ${supportedLevels.join(", ")}`,
    );
  }

  const level = args[levelIndex + 1]
    .trim()
    .toUpperCase();

  if (!supportedLevels.includes(level)) {
    throw new Error(
      `Unsupported level "${level}". Supported levels: ${supportedLevels.join(", ")}`,
    );
  }

   return {
  level,
  force:
    args.includes("--force"),

  semanticRepair:
    !args.includes(
      "--no-semantic-repair",
    ),

  qualityReview:
    !args.includes(
      "--no-quality-review",
    ),

  importToSupabase:
    args.includes("--import"),
};
}
