import type { LearningFeedback } from "@/lib/quests/types";

const NATURAL_PREFIXES = [
  "Природніше англійською:",
  "Natural answer:",
  "Correct answer:",
  "Як сказати природно:",
];

const EXPLANATION_PREFIXES = ["Чому саме так:", "Explanation:", "Пояснення:"];

const REMEMBER_PREFIXES = [
  "Запам'ятайте:",
  "Запам’ятайте:",
  "Remember:",
  "Корисно знати:",
];

const NPC_PREFIXES = ["Відповідь персонажа:", "NPC reply:"];

const CORRECTION_PREFIXES = [
  "Що саме виправити:",
  "What to correct:",
  "Correction:",
];

function stripPrefix(block: string, prefixes: string[]): string | null {
  for (const prefix of prefixes) {
    if (block.startsWith(prefix)) {
      return block.slice(prefix.length).trim();
    }
  }

  return null;
}

function parseCorrectionBlock(block: string): {
  originalFragment?: string;
  correctedFragment?: string;
} | null {
  const content = stripPrefix(block, CORRECTION_PREFIXES);

  if (content === null) {
    return null;
  }

  const lines = content
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);

  let originalFragment: string | undefined;

  let correctedFragment: string | undefined;

  for (const line of lines) {
    if (line.startsWith("❌")) {
      originalFragment = line.slice(1).trim();

      continue;
    }

    if (line.startsWith("✅")) {
      correctedFragment = line.slice(1).trim();
    }
  }

  if (!originalFragment && !correctedFragment) {
    return null;
  }

  return {
    originalFragment,
    correctedFragment,
  };
}

export function normalizeFeedback(
  feedback: string | LearningFeedback | null,
  isCorrect: boolean | null,
): LearningFeedback | null {
  if (!feedback) {
    return null;
  }

  if (typeof feedback !== "string") {
    return {
      encouragement:
        feedback.encouragement || (isCorrect === false ? "Майже!" : "Чудово!"),
      naturalAnswer: feedback.naturalAnswer?.trim() || undefined,
      explanation:
        feedback.explanation?.trim() ||
        (isCorrect === false
          ? "Подивімося, як це сказати природніше."
          : "Саме так це звучить у реальній розмові."),
      remember: feedback.remember?.trim() || undefined,
      npcReply: feedback.npcReply?.trim() || undefined,
      errorType: feedback.errorType,

      originalFragment: feedback.originalFragment?.trim() || undefined,

      correctedFragment: feedback.correctedFragment?.trim() || undefined,
      category: feedback.category,
    };
  }

  const blocks = feedback
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  let naturalAnswer: string | undefined;

  let explanation: string | undefined;

  let remember: string | undefined;

  let npcReply: string | undefined;

  let originalFragment: string | undefined;

  let correctedFragment: string | undefined;

  const mainBlocks: string[] = [];

  for (const block of blocks) {
    const correction = parseCorrectionBlock(block);

    if (correction) {
      originalFragment = correction.originalFragment;

      correctedFragment = correction.correctedFragment;

      continue;
    }
    const natural = stripPrefix(block, NATURAL_PREFIXES);

    if (natural !== null) {
      naturalAnswer = natural;
      continue;
    }

    const explained = stripPrefix(block, EXPLANATION_PREFIXES);

    if (explained !== null) {
      explanation = explained;
      continue;
    }

    const remembered = stripPrefix(block, REMEMBER_PREFIXES);

    if (remembered !== null) {
      remember = remembered;
      continue;
    }

    const npc = stripPrefix(block, NPC_PREFIXES);

    if (npc !== null) {
      npcReply = npc;
      continue;
    }

    mainBlocks.push(block);
  }

  if (!explanation) {
    explanation =
      mainBlocks.join("\n\n").trim() ||
      (isCorrect === false
        ? "Подивімося, як це сказати природніше."
        : "Саме так це звучить у реальній розмові.");
  }

  return {
    encouragement: isCorrect === false ? "Майже!" : "Чудово!",

    naturalAnswer,

    explanation,

    remember,

    npcReply,

    originalFragment,

    correctedFragment,
  };
}
