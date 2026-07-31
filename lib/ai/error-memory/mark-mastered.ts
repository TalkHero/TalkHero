import { createClient } from "@/lib/supabase/server";

const REQUIRED_SUCCESSFUL_USES = 3;

export async function markErrorSuccessful(
  errorId: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_language_errors")
    .select(
      "successful_uses,is_mastered",
    )
    .eq("id", errorId)
    .single();

  if (error || !data) {
    return;
  }

  const successfulUses =
    data.successful_uses + 1;

  const mastered =
    successfulUses >=
    REQUIRED_SUCCESSFUL_USES;

  await supabase
    .from("user_language_errors")
    .update({
      successful_uses: successfulUses,
      is_mastered: mastered,
      mastered_at: mastered
        ? new Date().toISOString()
        : null,
    })
    .eq("id", errorId);
}
