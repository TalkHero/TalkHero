import { MAX_GENERATION_ATTEMPTS } from "./config.mjs";
import { buildCategoryPrompt } from "./prompt-builder.mjs";
import { createCategorySchema } from "./schema.mjs";
import { validateCategoryQuestions } from "./validation.mjs";
import { normalizeText } from "./utils.mjs";
import { getExistingQuestions } from "./providers/provider.mjs";
import { repairSemanticDuplicates } from "./semantic-repair.mjs";
import { repairQualityIssues } from "./quality-review.mjs";
async function requestCategoryQuestions({
  client,
  model,
  level,
  category,
  count,
  existingPrompts,
}) {
  const response = await client.responses.create({
    model,

    instructions: [
      "You are an expert CEFR English assessment designer.",
      "Follow the requested CEFR level exactly.",
      "Follow the category requirements exactly.",
      "Follow the requested question count exactly.",
      "Follow the JSON schema exactly.",
    ].join(" "),

    input: buildCategoryPrompt({
      level,
      category,
      count,
      existingPrompts,
    }),

    text: {
      format: {
        type: "json_schema",
        name: `${level.toLowerCase()}_${category}_questions`,
        strict: true,

        schema: createCategorySchema({
          level,
          category,
          count,
        }),
      },
    },
  });

  if (!response.output_text) {
    throw new Error(
      `OpenAI returned an empty response for category "${category}".`,
    );
  }

  try {
    const parsed = JSON.parse(response.output_text);

    return parsed.questions;
  } catch (error) {
    throw new Error(
      `OpenAI returned invalid JSON for category "${category}": ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  }
}

async function generateCategoryWithRetries({
  client,
  model,
  level,
  category,
  count,
  existingPromptSet,
  existingPrompts,
}) {
  let lastError = null;

  for (
    let attempt = 1;
    attempt <= MAX_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    console.log(
      `Generating ${category}: ${count} question(s), attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}...`,
    );

    try {
      const questions =
        await requestCategoryQuestions({
          client,
          model,
          level,
          category,
          count,
          existingPrompts,
        });

      validateCategoryQuestions({
        questions,
        level,
        category,
        expectedCount: count,
        existingPromptSet,
      });

      console.log(
        `Validated ${category}: ${questions.length}/${count}.`,
      );

      return questions;
    } catch (error) {
  lastError =
    error instanceof Error
      ? error
      : new Error(String(error));

  console.error("");
  console.error(
    `Category "${category}" failed validation: ${lastError.message}`,
  );

  console.error(`Error name: ${lastError.name}`);

  if ("status" in lastError) {
    console.error(`HTTP status: ${lastError.status}`);
  }

  if ("code" in lastError) {
    console.error(`Error code: ${lastError.code}`);
  }

  if ("type" in lastError) {
    console.error(`Error type: ${lastError.type}`);
  }

  if ("request_id" in lastError) {
    console.error(
      `Request ID: ${lastError.request_id}`,
    );
  }

  if (lastError.cause) {
    console.error("Cause:");
    console.dir(lastError.cause, {
      depth: 6,
    });
  }

  console.error("Full error:");
  console.dir(lastError, {
    depth: 6,
  });

  if (attempt < MAX_GENERATION_ATTEMPTS) {
    console.log(
      `Retrying only category "${category}"...`,
    );
  }
}

}

throw new Error(
  `Category "${category}" failed after ${MAX_GENERATION_ATTEMPTS} attempts. Last error: ${lastError?.message ?? "Unknown error"}`,
);
}

export async function generateLevelQuestions({
  client,
  model,
  level,
  config,
   semanticRepair = true,
  qualityReview = true,
}) {

const allQuestions = [];

const existingPromptSet = new Set();

const existingPrompts = [];

const existingQuestions = await getExistingQuestions();

for (const question of existingQuestions) {
  if (!question?.prompt) {
    continue;
  }

  const normalized = normalizeText(question.prompt);

  existingPromptSet.add(normalized);
  existingPrompts.push(question.prompt);
}

console.log(
  `Loaded ${existingPrompts.length} existing question(s) from providers.`,
);

  for (const [category, count] of Object.entries(config)) {
    const categoryQuestions =
      await generateCategoryWithRetries({
        client,
        model,
        level,
        category,
        count,
        existingPromptSet,
        existingPrompts,
      });

    for (const question of categoryQuestions) {
      allQuestions.push(question);
      existingPrompts.push(question.prompt);

      existingPromptSet.add(
        normalizeText(question.prompt),
      );
    }
  }

    if (!semanticRepair) {
    console.log("");
    console.log(
      "Semantic duplicate repair skipped by --no-semantic-repair.",
    );

    return allQuestions;
  }

    let finalQuestions = allQuestions;

  if (!semanticRepair) {
    console.log("");
    console.log(
      "Semantic duplicate repair skipped by --no-semantic-repair.",
    );
  } else {
    finalQuestions =
      await repairSemanticDuplicates({
        client,
        questions: finalQuestions,
        referenceQuestions: existingQuestions,

        generateReplacement: async ({
          category,
          blockedQuestions,
        }) => {
          const blockedPrompts =
            blockedQuestions
              .map(
                (question) =>
                  question?.prompt,
              )
              .filter(
                (prompt) =>
                  typeof prompt === "string" &&
                  prompt.trim().length > 0,
              );

          const blockedPromptSet =
            new Set(
              blockedPrompts.map((prompt) =>
                normalizeText(prompt),
              ),
            );

          const replacementQuestions =
            await generateCategoryWithRetries({
              client,
              model,
              level,
              category,
              count: 1,
              existingPromptSet:
                blockedPromptSet,
              existingPrompts:
                blockedPrompts,
            });

          return replacementQuestions[0];
        },
      });
  }

  if (!qualityReview) {
    console.log("");
    console.log(
      "AI quality review skipped by --no-quality-review.",
    );

    return finalQuestions;
  }

  const reviewModel =
    process.env.OPENAI_REVIEW_MODEL ||
    model;

  finalQuestions =
    await repairQualityIssues({
      client,
      model: reviewModel,
      level,
      questions: finalQuestions,

      generateReplacement: async ({
        category,
        blockedQuestions,
        reviewFeedback,
      }) => {
        const blockedPrompts =
          blockedQuestions
            .map(
              (question) =>
                question?.prompt,
            )
            .filter(
              (prompt) =>
                typeof prompt === "string" &&
                prompt.trim().length > 0,
            );

        /*
         * Add reviewer feedback to the blocked prompt context.
         * This gives the generator a direct instruction about
         * what must not be repeated.
         */
        const reviewInstruction = [
          "The previous question was rejected by an independent reviewer.",
          `Severity: ${reviewFeedback.severity}.`,
          `Issues: ${reviewFeedback.issues.join(", ")}.`,
          `Feedback: ${reviewFeedback.feedback_uk}`,
          "Generate a completely new question that fixes these problems.",
        ].join(" ");

        const replacementQuestions =
          await generateCategoryWithRetries({
            client,
            model,
            level,
            category,
            count: 1,
            existingPromptSet: new Set(
              blockedPrompts.map((prompt) =>
                normalizeText(prompt),
              ),
            ),
            existingPrompts: [
              ...blockedPrompts,
              reviewInstruction,
            ],
          });

        return replacementQuestions[0];
      },
    });

  /*
   * Quality replacements are newly generated, so perform
   * one final semantic duplicate pass.
   */
  if (semanticRepair) {
    finalQuestions =
      await repairSemanticDuplicates({
        client,
        questions: finalQuestions,
        referenceQuestions: existingQuestions,

        generateReplacement: async ({
          category,
          blockedQuestions,
        }) => {
          const blockedPrompts =
            blockedQuestions
              .map(
                (question) =>
                  question?.prompt,
              )
              .filter(
                (prompt) =>
                  typeof prompt === "string" &&
                  prompt.trim().length > 0,
              );

          const replacementQuestions =
            await generateCategoryWithRetries({
              client,
              model,
              level,
              category,
              count: 1,
              existingPromptSet: new Set(
                blockedPrompts.map((prompt) =>
                  normalizeText(prompt),
                ),
              ),
              existingPrompts:
                blockedPrompts,
            });

          return replacementQuestions[0];
        },
      });
  }

  return finalQuestions;
}
