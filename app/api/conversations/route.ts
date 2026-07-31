import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { API_ERRORS } from "@/lib/i18n/errors";

export async function GET() {
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

    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      conversations: conversations ?? [],
    });
  } catch (error) {
    console.error("CONVERSATIONS API ERROR:", error);

    return NextResponse.json(
      { error: API_ERRORS.failedToLoadConversations },
      { status: 500 },
    );
  }
}
