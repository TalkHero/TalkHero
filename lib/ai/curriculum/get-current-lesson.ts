import type {
  EnglishLevel,
  LessonContext,
} from "@/lib/ai/tutor/types";
import { A1_LESSONS } from "./a1-lessons";

const FALLBACK_LESSONS: Record<EnglishLevel, LessonContext> = {
  A1: A1_LESSONS[0],
  A2: {
    id: "A2-U1-L1",
    level: "A2",
    unit: 1,
    lesson: 1,
    title: "Talking About the Past",
    topic: "Past experiences and yesterday",
    grammar: ["Past Simple", "Regular and irregular verbs"],
    vocabulary: [
      "yesterday",
      "last week",
      "visited",
      "went",
      "saw",
      "stayed",
    ],
    objectives: [
      "Talk about yesterday",
      "Use common Past Simple verbs",
      "Ask and answer simple questions about past events",
    ],
    speakingTask:
      "Describe what you did yesterday in four to six sentences.",
    homework:
      "Write a short paragraph about your last weekend.",
  },
  B1: {
    id: "B1-U1-L1",
    level: "B1",
    unit: 1,
    lesson: 1,
    title: "Travel Experiences",
    topic: "Talking about memorable trips",
    grammar: [
      "Past Simple and Present Perfect",
      "Time expressions",
    ],
    vocabulary: [
      "journey",
      "destination",
      "accommodation",
      "experience",
      "abroad",
      "memorable",
    ],
    objectives: [
      "Describe a past trip",
      "Compare Past Simple and Present Perfect",
      "Give reasons and details",
    ],
    speakingTask:
      "Describe a memorable trip and explain why it was important.",
    homework:
      "Write a short travel story using both Past Simple and Present Perfect.",
  },
  B2: {
    id: "B2-U1-L1",
    level: "B2",
    unit: 1,
    lesson: 1,
    title: "Expressing and Defending Opinions",
    topic: "Structured discussion and argument",
    grammar: [
      "Complex linking phrases",
      "Modal verbs for speculation and opinion",
    ],
    vocabulary: [
      "from my perspective",
      "however",
      "nevertheless",
      "evidence",
      "argument",
      "counterargument",
    ],
    objectives: [
      "Express a clear opinion",
      "Support ideas with examples",
      "Respond to an opposing view",
    ],
    speakingTask:
      "Give your opinion on whether remote work is better than office work.",
    homework:
      "Write a balanced opinion paragraph with one argument and one counterargument.",
  },
  C1: {
    id: "C1-U1-L1",
    level: "C1",
    unit: 1,
    lesson: 1,
    title: "Nuanced Discussion",
    topic: "Social and professional issues",
    grammar: [
      "Advanced discourse markers",
      "Hedging and emphasis",
    ],
    vocabulary: [
      "arguably",
      "to a certain extent",
      "underlying issue",
      "far-reaching",
      "implication",
      "perspective",
    ],
    objectives: [
      "Discuss a complex issue with nuance",
      "Use advanced linking language",
      "Distinguish strong and cautious claims",
    ],
    speakingTask:
      "Discuss how technology influences human relationships.",
    homework:
      "Write a nuanced response that includes both benefits and risks.",
  },
  C2: {
    id: "C2-U1-L1",
    level: "C2",
    unit: 1,
    lesson: 1,
    title: "Precision, Register and Style",
    topic: "Adapting language to audience and purpose",
    grammar: [
      "Advanced register control",
      "Stylistic reformulation",
    ],
    vocabulary: [
      "subtle distinction",
      "rhetorical effect",
      "register",
      "connotation",
      "ambiguity",
      "stylistic choice",
    ],
    objectives: [
      "Adapt language to formal and informal contexts",
      "Explain subtle differences in meaning",
      "Improve precision and rhetorical effect",
    ],
    speakingTask:
      "Explain the same complex idea to a child, a colleague, and an academic audience.",
    homework:
      "Rewrite one paragraph in three different registers.",
  },
};

export function getCurrentLesson(
  level: EnglishLevel,
  lessonIndex = 0,
): LessonContext {
  if (level === "A1") {
    return A1_LESSONS[lessonIndex] ?? A1_LESSONS[0];
  }

  return FALLBACK_LESSONS[level];
}
