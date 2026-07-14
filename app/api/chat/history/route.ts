import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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

    const url = new URL(request.url);
    const requestedConversationId =
      url.searchParams.get("conversationId");

    let conversationId = requestedConversationId;

    if (conversationId) {
      const {
        data: conversation,
        error: conversationError,
      } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
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
    } else {
      const {
        data: latestConversation,
        error: conversationError,
      } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (conversationError) {
        throw conversationError;
      }

      if (!latestConversation) {
        return NextResponse.json({
          conversationId: null,
          messages: [],
        });
      }

      conversationId = latestConversation.id;
    }

    const { data: messages, error: messagesError } =
      await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    return NextResponse.json({
      conversationId,
      messages: messages ?? [],
    });
  } catch (error) {
    console.error("CHAT HISTORY ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load chat history" },
      { status: 500 },
    );
  }
}
