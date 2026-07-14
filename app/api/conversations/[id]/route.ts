import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 },
      );
    }

    // Перевіряємо, що розмова існує
    // і належить поточному користувачу.
    const {
      data: conversation,
      error: conversationError,
    } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (conversationError) {
      throw conversationError;
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Спочатку видаляємо повідомлення.
    const { error: messagesDeleteError } = await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", id);

    if (messagesDeleteError) {
      throw messagesDeleteError;
    }

    // Потім видаляємо саму розмову.
    const { error: conversationDeleteError } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (conversationDeleteError) {
      throw conversationDeleteError;
    }

    return NextResponse.json({
      success: true,
      deletedConversationId: id,
    });
  } catch (error) {
    console.error("DELETE CONVERSATION ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 },
    );
  }
}
