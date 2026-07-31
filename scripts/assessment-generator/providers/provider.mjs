import { getLocalQuestions } from "./local-provider.mjs";
import { getSupabaseQuestions } from "./supabase-provider.mjs";

export async function getExistingQuestions() {
  const local = await getLocalQuestions();

  const supabase = await getSupabaseQuestions();

  return [...local, ...supabase];
}
