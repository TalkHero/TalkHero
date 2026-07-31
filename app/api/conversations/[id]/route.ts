import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { API_ERRORS } from "@/lib/i18n/errors";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type RenameConversationRequest = {
  title?: string;
};

export async function PATCH(
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
        { error: API_ERRORS.unauthorized },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: API_ERRORS.conversationIdRequired },
        { status: 400 },
      );
    }

    let body: RenameConversationRequest;

    try {
      body = (await request.json()) as RenameConversationRequest;
    } catch {
      return NextResponse.json(
        { error: "Некоректні дані запиту." },
        { status: 400 },
      );
    }

    const title = body.title
      ?.replace(/\s+/g, " ")
      .trim();

    if (!title) {
      return NextResponse.json(
        { error: "Назва розмови обов'язкова." },
        { status: 400 },
      );
    }

    if (title.length > 60) {
      return NextResponse.json(
        {
          error:
            "Назва розмови не може містити більше ніж 60 символів.",
        },
        { status: 400 },
      );
    }

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
        { error: API_ERRORS.conversationNotFound },
        { status: 404 },
      );
    }

    const {
      data: updatedConversation,
      error: updateError,
    } = await supabase
      .from("conversations")
      .update({
        title,
        title_locked: true,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, title, created_at")
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      conversation: updatedConversation,
    });
  } catch (error) {
    console.error("RENAME CONVERSATION ERROR:", error);

    return NextResponse.json(
      { error: "Не вдалося перейменувати розмову." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
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
        { error: API_ERRORS.unauthorized },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: API_ERRORS.conversationIdRequired },
        { status: 400 },
      );
    }

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
        { error: API_ERRORS.conversationNotFound },
        { status: 404 },
      );
    }

    const { error: messagesDeleteError } = await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", id);

    if (messagesDeleteError) {
      throw messagesDeleteError;
    }

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
      { error: "Не вдалося видалити розмову." },
      { status: 500 },
    );
  }
}
