import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  buildPrompt,
} from "../lib/quest-factory/prompt.mjs";

import {
  repairQuest,
  validateQuest,
} from "../lib/quest-factory/repair.mjs";

const MAX_GENERATION_ATTEMPTS = 3;

function outputText(body) {
  if (
    typeof body.output_text ===
    "string"
  ) {
    return body.output_text.trim();
  }

  for (const item of body.output ?? []) {
    if (item?.type !== "message") {
      continue;
    }

    for (const part of item.content ?? []) {
      if (
        part?.type === "output_text" &&
        typeof part.text === "string"
      ) {
        return part.text.trim();
      }

      if (part?.type === "refusal") {
        throw new Error(
          `Model refusal: ${
            part.refusal ?? "unknown"
          }`,
        );
      }
    }
  }

  return "";
}

function errorMessage(error) {
  return error instanceof Error
    ? error.message
    : String(error);
}

function buildRepairPrompt({
  originalPrompt,
  validationError,
  invalidQuest,
}) {
  return [
    originalPrompt,
    "",
    "IMPORTANT: A previous generated version failed validation.",
    "",
    "VALIDATION ERRORS:",
    validationError,
    "",
    "Correct every error and return the complete quest object again.",
    "",
    "Mandatory correction rules:",
    "- For input and voice scenes, content must be the NPC question or situational context.",
    "- For translate scenes, content must be the Ukrainian sentence to translate.",
    "- prompt must be a Ukrainian instruction for the learner.",
    "- Correct learner responses belong only in expectedAnswer.",
    "- Never copy an accepted answer into content or prompt.",
    "- Never use 'Your response to ...' or 'Your answer:' as the main prompt.",
    "- Do not expose a model answer before submission.",
    "",
    "PREVIOUS INVALID QUEST:",
    JSON.stringify(
      invalidQuest,
      null,
      2,
    ),
  ].join("\n");
}

async function requestQuest({
  apiKey,
  model,
  schema,
  systemPrompt,
  userPrompt,
}) {
  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${apiKey}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_output_tokens: 12000,
        text: {
          format: {
            type: "json_schema",
            name:
              "talkhero_static_quest",
            strict: true,
            schema,
          },
        },
      }),
    },
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(
      `OpenAI ${response.status}: ${
        body?.error?.message ??
        "unknown error"
      }`,
    );
  }

  if (body.status === "incomplete") {
    throw new Error(
      `Incomplete response: ${JSON.stringify(
        body.incomplete_details ?? {},
      )}`,
    );
  }

  const text = outputText(body);

  if (!text) {
    throw new Error(
      "OpenAI returned no quest JSON.",
    );
  }

  return JSON.parse(text);
}

async function generateValidQuest({
  apiKey,
  model,
  schema,
  request,
}) {
  const prompt = buildPrompt(request);

  let userPrompt = prompt.user;
  let lastError = null;

  for (
    let attempt = 1;
    attempt <= MAX_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    console.log(
      `Generation attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}...`,
    );

    const rawQuest =
      await requestQuest({
        apiKey,
        model,
        schema,
        systemPrompt:
          prompt.system,
        userPrompt,
      });

    let quest;

try {
  quest = repairQuest(
    rawQuest,
    request,
  );

  validateQuest(quest);

  return quest;
} catch (error) {
      lastError = error;

      const validationError =
        errorMessage(error);

      console.warn(
        `Attempt ${attempt} failed validation:`,
      );

      console.warn(validationError);

      if (
        attempt <
        MAX_GENERATION_ATTEMPTS
      ) {
        userPrompt =
          buildRepairPrompt({
            originalPrompt:
              prompt.user,
            validationError,
            invalidQuest:
              rawQuest,
          });
      }
    }
  }

  throw new Error(
    [
      `Unable to generate a valid quest after ${MAX_GENERATION_ATTEMPTS} attempts.`,
      errorMessage(lastError),
    ].join("\n"),
  );
}

async function main() {
  const requestFile =
    process.argv[2];

  if (!requestFile) {
    throw new Error(
      "Usage: node scripts/generate-ai-quest.mjs <request.json> [output.json]",
    );
  }

  const apiKey =
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured.",
    );
  }

  const request = JSON.parse(
    await readFile(
      path.resolve(requestFile),
      "utf8",
    ),
  );

  const schema = JSON.parse(
    await readFile(
      new URL(
        "../lib/quest-factory/schema.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );

  const model =
    process.env.OPENAI_QUEST_MODEL ||
    "gpt-4o-mini";

  const quest =
    await generateValidQuest({
      apiKey,
      model,
      schema,
      request,
    });

  const output = path.resolve(
    process.argv[3] ??
      `content/generated/${quest.slug}.json`,
  );

  await mkdir(
    path.dirname(output),
    {
      recursive: true,
    },
  );

  await writeFile(
    output,
    `${JSON.stringify(
      quest,
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    `✓ Quest: ${quest.slug}`,
  );

  console.log(
    `✓ Model: ${model}`,
  );

  console.log(
    `✓ Scenes: ${quest.scenes.length}`,
  );

  console.log(
    `✓ Output: ${output}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

