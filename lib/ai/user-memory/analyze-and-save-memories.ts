import OpenAI from "openai";

import { saveUserMemories } from "./save-memories";
import {
  USER_MEMORY_CATEGORIES,
  type AnalyzeUserMemoriesInput,
  type DetectedUserMemory,
  type UserMemoryCategory,
} from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type MemoryAnalysisResponse = {
  memories: Array<{
    memoryKey: string;
    memoryValue: string;
    category: string;
    confidence: number;
  }>;
};

function isMemoryCategory(value: string): value is UserMemoryCategory {
  return USER_MEMORY_CATEGORIES.includes(value as UserMemoryCategory);
}

function normalizeMemoryKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizeMemories(
  response: MemoryAnalysisResponse,
): DetectedUserMemory[] {
  const result: DetectedUserMemory[] = [];

  for (const memory of response.memories ?? []) {
    if (!isMemoryCategory(memory.category)) {
      continue;
    }

    const memoryKey = normalizeMemoryKey(memory.memoryKey ?? "");

    const memoryValue = memory.memoryValue?.trim();

    const confidence = Number(memory.confidence);

    if (!memoryKey || !memoryValue || !Number.isFinite(confidence)) {
      continue;
    }

    if (confidence < 0.6 || confidence > 1) {
      continue;
    }

    result.push({
      memoryKey,
      memoryValue,
      category: memory.category,
      confidence,
    });
  }

  return result.slice(0, 3);
}

export async function analyzeAndSaveUserMemories({
  userId,
  conversationId,
  userMessage,
  assistantMessage,
}: AnalyzeUserMemoriesInput): Promise<DetectedUserMemory[]> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    max_tokens: 500,

    response_format: {
      type: "json_schema",

      json_schema: {
        name: "user_memory_analysis",
        strict: true,

        schema: {
          type: "object",
          additionalProperties: false,

          properties: {
            memories: {
              type: "array",
              maxItems: 3,

              items: {
                type: "object",
                additionalProperties: false,

                properties: {
                  memoryKey: {
                    type: "string",
                  },

                  memoryValue: {
                    type: "string",
                  },

                  category: {
                    type: "string",
                    enum: USER_MEMORY_CATEGORIES,
                  },

                  confidence: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                  },
                },

                required: [
                  "memoryKey",
                  "memoryValue",
                  "category",
                  "confidence",
                ],
              },
            },
          },

          required: ["memories"],
        },
      },
    },

    messages: [
      {
        role: "system",

        content: `
You extract stable, useful facts about a language learner from a conversation.

Only save information that would genuinely help a tutor in future conversations.

GOOD memories include:

- occupation or profession;
- city or country where the student lives;
- stable hobbies and interests;
- education;
- recurring preferences;
- long-term English-learning goals;
- stable personal facts explicitly stated by the student.

DO NOT save:

- temporary emotions;
- temporary plans;
- what happened today or yesterday;
- weather;
- one-time activities;
- random conversation details;
- guesses;
- facts stated only by the tutor;
- sensitive information unless it is clearly necessary for language-learning personalization.

Important:

- Extract facts only from the STUDENT MESSAGE.
- The tutor response is context only.
- Do not invent information.
- If there is nothing worth remembering, return an empty memories array.
- Return at most three memories.
- Prefer stable reusable keys.

Good memoryKey examples:

occupation
city
country
favorite_sport
favorite_music
learning_goal
preferred_learning_method
field_of_study

Bad memoryKey examples:

fact_1
today_activity
conversation_topic
random_detail

memoryValue should be concise and human-readable.

If the student corrects or updates an old fact, return the new current value.

Confidence guide:

1.0 = directly and clearly stated
0.8 = strongly implied
below 0.6 = do not return it
`.trim(),
      },

      {
        role: "user",

        content: `
STUDENT MESSAGE:

${userMessage}

TUTOR RESPONSE:

${assistantMessage}
`.trim(),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();

  if (!content) {
    return [];
  }

  let parsed: MemoryAnalysisResponse;

  try {
    parsed = JSON.parse(content) as MemoryAnalysisResponse;
  } catch (error) {
    console.error("PARSE USER MEMORY ANALYSIS ERROR:", error);

    return [];
  }

  const memories = normalizeMemories(parsed);

  if (memories.length === 0) {
    return [];
  }

  await saveUserMemories({
    userId,
    conversationId,
    memories,
  });

  return memories;
}
