import { createClient } from "@/lib/supabase/server";
import type {
  DetectedLanguageError,
  SaveErrorsInput,
  UserLanguageError,
} from "./types";

function removeDuplicateErrors(
  errors: DetectedLanguageError[],
): DetectedLanguageError[] {
  const uniqueErrors = new Map<string, DetectedLanguageError>();

  for (const error of errors) {
    if (!error.errorKey.trim()) {
      continue;
    }

    uniqueErrors.set(error.errorKey.trim(), {
      ...error,
      errorKey: error.errorKey.trim(),
      originalText: error.originalText.trim(),
      correctedText: error.correctedText.trim(),
      explanation: error.explanation?.trim() || null,
    });
  }

  return [...uniqueErrors.values()];
}

export async function saveErrors({
  userId,
  errors,
}: SaveErrorsInput): Promise<void> {
  const normalizedErrors = removeDuplicateErrors(errors);

  if (normalizedErrors.length === 0) {
    return;
  }

  const supabase = await createClient();
  const errorKeys = normalizedErrors.map((error) => error.errorKey);

  const { data: existingData, error: loadError } = await supabase
    .from("user_language_errors")
    .select("*")
    .eq("user_id", userId)
    .in("error_key", errorKeys);

  if (loadError) {
    throw loadError;
  }

  const existingErrors =
    (existingData as UserLanguageError[] | null) ?? [];

  const existingErrorsByKey = new Map(
    existingErrors.map((error) => [error.error_key, error]),
  );

const errorsToInsert: Array<{
  user_id: string;
  error_type: DetectedLanguageError["errorType"];
  error_key: string;
  original_text: string;
  corrected_text: string;
  explanation: string | null;
  occurrence_count: number;
  successful_uses: number;
  is_mastered: boolean;
  first_seen_at: string;
  last_seen_at: string;
  last_success_at: null;
  mastered_at: null;
}> = [];

  const updates: Promise<void>[] = [];
  const now = new Date().toISOString();

  for (const detectedError of normalizedErrors) {
    const existingError = existingErrorsByKey.get(
      detectedError.errorKey,
    );

    if (!existingError) {
      errorsToInsert.push({
  user_id: userId,
  error_type: detectedError.errorType,
  error_key: detectedError.errorKey,
  original_text: detectedError.originalText,
  corrected_text: detectedError.correctedText,
  explanation: detectedError.explanation,
  occurrence_count: 1,
  successful_uses: 0,
  is_mastered: false,
  first_seen_at: now,
  last_seen_at: now,
  last_success_at: null,
  mastered_at: null,
});

      continue;
    }

    updates.push(
      (async () => {
        const { error: updateError } = await supabase
          .from("user_language_errors")
          .update({
  error_type: detectedError.errorType,
  original_text: detectedError.originalText,
  corrected_text: detectedError.correctedText,
  explanation:
    detectedError.explanation ??
    existingError.explanation,
  occurrence_count:
    existingError.occurrence_count + 1,
  successful_uses: 0,
  is_mastered: false,
  last_success_at: null,
  mastered_at: null,
  last_seen_at: now,
})
          .eq("id", existingError.id)
          .eq("user_id", userId);

        if (updateError) {
          throw updateError;
        }
      })(),
    );
  }

  if (errorsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("user_language_errors")
      .insert(errorsToInsert);

    if (insertError) {
      throw insertError;
    }
  }

  if (updates.length > 0) {
    await Promise.all(updates);
  }
}
