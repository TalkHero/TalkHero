import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateVocabularyCard } from "@/lib/vocabulary/generate-vocabulary-card";

import type { QuestSceneEvaluationResult } from "./evaluation";
import type { QuestSceneRecord } from "./types";

type SaveCorrectAnswerVocabularyInput = {
  userId: string;
  scene: QuestSceneRecord;
  userInput: unknown;
  evaluation: QuestSceneEvaluationResult;
};

type ExistingVocabularyRow = {
  id: string;
  word: string;
  translation: string | null;
  meaning: string | null;
  example: string | null;
};

function normalizeApostrophes(value: string): string {
  return value.replace(/[’‘`]/g, "'");
}

function normalizeVocabularyKey(value: string): string {
  return normalizeApostrophes(value)
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/\s+/g, " ")
    .replace(/^[\s"'“”‘’.,!?;:()[\]{}]+/g, "")
    .replace(/[\s"'“”‘’.,!?;:()[\]{}]+$/g, "")
    .trim();
}

function cleanVocabularyDisplayValue(value: string): string {
  return normalizeApostrophes(value)
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[\s"'“”‘’]+/g, "")
    .replace(/[\s"'“”‘’.,!?;:]+$/g, "")
    .trim();
}

function extractEnglishWords(value: string): string[] {
  const normalized = normalizeApostrophes(value).normalize("NFKC");

  const matches = normalized.match(/[A-Za-z]+(?:'[A-Za-z]+)*/g) ?? [];

  return matches
    .map((word) => cleanVocabularyDisplayValue(word))
    .filter(Boolean);
}

function getChoiceText(
  scene: QuestSceneRecord,
  userInput: unknown,
): string | null {
  if (scene.scene_type !== "choice") {
    return null;
  }

  const options = Array.isArray(scene.options) ? scene.options : [];

  if (typeof userInput === "string") {
    const selected = options.find(
      (option) => option.id === userInput || option.value === userInput,
    );

    if (selected && typeof selected.text === "string" && selected.text.trim()) {
      return selected.text.trim();
    }
  }

  if (userInput && typeof userInput === "object" && !Array.isArray(userInput)) {
    const inputObject = userInput as Record<string, unknown>;

    const optionId =
      typeof inputObject.optionId === "string"
        ? inputObject.optionId
        : typeof inputObject.id === "string"
          ? inputObject.id
          : typeof inputObject.value === "string"
            ? inputObject.value
            : null;

    if (optionId) {
      const selected = options.find(
        (option) => option.id === optionId || option.value === optionId,
      );

      if (
        selected &&
        typeof selected.text === "string" &&
        selected.text.trim()
      ) {
        return selected.text.trim();
      }
    }
  }

  return null;
}

function getCorrectAnswerText({
  scene,
  userInput,
  evaluation,
}: {
  scene: QuestSceneRecord;
  userInput: unknown;
  evaluation: QuestSceneEvaluationResult;
}): string | null {
  if (evaluation.isCorrect !== true) {
    return null;
  }

  const choiceText = getChoiceText(scene, userInput);

  if (choiceText) {
    return choiceText;
  }

  if (evaluation.mode === "ai") {
    const metadata = evaluation.metadata ?? {};

    const possibleAiAnswers = [
      metadata.naturalAnswer,
      metadata.correctedAnswer,
      metadata.correctedFragment,
    ];

    for (const candidate of possibleAiAnswers) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  if (typeof userInput === "string" && userInput.trim()) {
    return userInput.trim();
  }

  return null;
}

function buildVocabularyItems(answer: string): string[] {
  const phrase = cleanVocabularyDisplayValue(answer);

  if (!phrase) {
    return [];
  }

  const words = extractEnglishWords(phrase);

  const candidates = [phrase, ...words];

  const uniqueByKey = new Map<string, string>();

  for (const candidate of candidates) {
    const displayValue = cleanVocabularyDisplayValue(candidate);

    const key = normalizeVocabularyKey(displayValue);

    if (!key || displayValue.length > 100) {
      continue;
    }

    if (!uniqueByKey.has(key)) {
      uniqueByKey.set(key, displayValue);
    }
  }

  return Array.from(uniqueByKey.values());
}

export async function saveCorrectAnswerVocabulary({
  userId,
  scene,
  userInput,
  evaluation,
}: SaveCorrectAnswerVocabularyInput): Promise<void> {
  if (!userId.trim() || evaluation.isCorrect !== true) {
    return;
  }

  const answer = getCorrectAnswerText({
    scene,
    userInput,
    evaluation,
  });

  if (!answer) {
    return;
  }

  const vocabularyItems = buildVocabularyItems(answer);

  if (vocabularyItems.length === 0) {
    return;
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("native_language, target_language, english_level")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const { data: existingRowsData, error: existingError } = await admin
    .from("vocabulary")
    .select(
      `
        id,
        word,
        translation,
        meaning,
        example
      `,
    )
    .eq("user_id", userId);

  if (existingError) {
    throw existingError;
  }

  const existingRows = (existingRowsData ?? []) as ExistingVocabularyRow[];

  const existingByKey = new Map<string, ExistingVocabularyRow>();

  for (const row of existingRows) {
    if (typeof row.word !== "string" || !row.word.trim()) {
      continue;
    }

    existingByKey.set(normalizeVocabularyKey(row.word), row);
  }

  const rowsToInsert: Array<{
    user_id: string;
    word: string;
    translation: string;
    meaning: string;
    example: string;
    status: string;
    review_count: number;
  }> = [];

  for (const item of vocabularyItems) {
    const itemKey = normalizeVocabularyKey(item);

    if (!itemKey) {
      continue;
    }

    const existingItem = existingByKey.get(itemKey);

    /*
     * Слово вже існує, але картка
     * неповна — дозаповнюємо її.
     */
    if (existingItem) {
      const needsEnrichment =
        !existingItem.translation?.trim() ||
        !existingItem.meaning?.trim() ||
        !existingItem.example?.trim();

      if (!needsEnrichment) {
        continue;
      }

      try {
        const generated = await generateVocabularyCard({
          word: existingItem.word,
          context: answer,
          nativeLanguage: profile?.native_language,
          targetLanguage: profile?.target_language,
          englishLevel: profile?.english_level,
        });

        const { error: updateError } = await admin
          .from("vocabulary")
          .update({
            translation: generated.translation,
            meaning: generated.meaning,
            example: generated.example,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingItem.id)
          .eq("user_id", userId);

        if (updateError) {
          throw updateError;
        }

        existingItem.translation = generated.translation;
        existingItem.meaning = generated.meaning;
        existingItem.example = generated.example;
      } catch (error) {
        console.error("FAILED TO ENRICH EXISTING VOCABULARY CARD:", {
          item,
          error,
        });
      }

      continue;
    }

    try {
      const generated = await generateVocabularyCard({
        word: item,
        context: answer,
        nativeLanguage: profile?.native_language,
        targetLanguage: profile?.target_language,
        englishLevel: profile?.english_level,
      });

      const isPhrase = item.trim().includes(" ");

      const resolvedWord = isPhrase
        ? cleanVocabularyDisplayValue(item)
        : generated.word;

      const generatedKey = normalizeVocabularyKey(resolvedWord);

      if (!generatedKey) {
        continue;
      }

      /*
       * Наприклад AI може нормалізувати
       * "sending" -> "send".
       */
      const normalizedExisting = existingByKey.get(generatedKey);

      if (normalizedExisting) {
        const needsEnrichment =
          !normalizedExisting.translation?.trim() ||
          !normalizedExisting.meaning?.trim() ||
          !normalizedExisting.example?.trim();

        if (needsEnrichment) {
          const { error: updateError } = await admin
            .from("vocabulary")
            .update({
              translation: generated.translation,
              meaning: generated.meaning,
              example: generated.example,
              updated_at: new Date().toISOString(),
            })
            .eq("id", normalizedExisting.id)
            .eq("user_id", userId);

          if (updateError) {
            throw updateError;
          }

          normalizedExisting.translation = generated.translation;
          normalizedExisting.meaning = generated.meaning;
          normalizedExisting.example = generated.example;
        }

        continue;
      }

      rowsToInsert.push({
        user_id: userId,
        word: resolvedWord,
        translation: generated.translation,
        meaning: generated.meaning,
        example: generated.example,
        status: "new",
        review_count: 0,
      });

      existingByKey.set(generatedKey, {
        id: "",
        word: resolvedWord,
        translation: generated.translation,
        meaning: generated.meaning,
        example: generated.example,
      });
    } catch (error) {
      console.error("FAILED TO GENERATE VOCABULARY CARD:", {
        item,
        error,
      });
    }
  }

  if (rowsToInsert.length === 0) {
    return;
  }

  const { error: insertError } = await admin
    .from("vocabulary")
    .insert(rowsToInsert);

  if (insertError && insertError.code !== "23505") {
    throw insertError;
  }
}
