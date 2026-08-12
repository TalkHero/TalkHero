import { createClient } from "@/lib/supabase/server";

import type { SaveUserMemoriesInput } from "./types";

export async function saveUserMemories({
  userId,
  conversationId,
  memories,
}: SaveUserMemoriesInput): Promise<void> {
  if (memories.length === 0) {
    return;
  }

  const supabase = await createClient();

  const rows = memories.map((memory) => ({
    user_id: userId,
    memory_key: memory.memoryKey,
    memory_value: memory.memoryValue,
    category: memory.category,
    confidence: memory.confidence,
    source_conversation_id: conversationId,
    last_confirmed_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("user_memories").upsert(rows, {
    onConflict: "user_id,memory_key",
  });

  if (error) {
    throw error;
  }
}
