import { createClient } from "@/lib/supabase/server";
import type { UserLanguageError } from "./types";

export async function loadErrors(
  userId: string,
): Promise<UserLanguageError[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_language_errors")
    .select("*")
    .eq("user_id", userId)
    .eq("is_mastered", false)
    .order("occurrence_count", {
      ascending: false,
    })
    .order("last_seen_at", {
      ascending: false,
    })
    .limit(10);

  if (error) {
    console.error(
      "LOAD LANGUAGE ERRORS:",
      error,
    );

    return [];
  }

  return (data ?? []) as UserLanguageError[];
}
