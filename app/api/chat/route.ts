import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatRequest = {
  message?: string;
  conversationId?: string | null;
};

export async function POST(request: Request) {
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

    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    let conversationId = body.conversationId ?? null;

    if (conversationId) {
      const { data: conversation, error } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 },
        );
      }
    } else {
      conversationId = crypto.randomUUID();

      const title =
        message.length > 40
          ? `${message.slice(0, 40)}...`
          : message;

      const { error } = await supabase
        .from("conversations")
        .insert({
          id: conversationId,
          user_id: user.id,
          title,
        });

      if (error) {
        throw error;
      }
    }

    const { error: userMessageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: message,
      });

    if (userMessageError) {
      throw userMessageError;
    }

    const { data: history, error: historyError } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (historyError) {
      throw historyError;
    }

    const encoder = new TextEncoder();
    const currentConversationId = conversationId;

    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";

        function sendEvent(
          event: string,
          data: Record<string, unknown>,
        ) {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
            ),
          );
        }

        try {
          sendEvent("conversation", {
            conversationId: currentConversationId,
          });

          const completionStream =
            await openai.chat.completions.create({
              model: "gpt-4.1-mini",
              stream: true,
              messages: [
                {
                  role: "system",
                  content:
                    "You are Emma, a friendly English tutor. Help the student practice English conversation. Correct mistakes naturally and briefly. Keep answers encouraging, concise, and educational. Use English unless a short explanation in the student's native language is necessary.",
                },
                ...(history ?? []).map((item) => ({
                  role: item.role as "user" | "assistant",
                  content: item.content,
                })),
              ],
            });

          for await (const chunk of completionStream) {
            const text =
              chunk.choices[0]?.delta?.content ?? "";

            if (!text) continue;

            fullText += text;

            sendEvent("delta", {
              text,
            });
          }

          if (!fullText.trim()) {
            fullText =
              "Sorry, I could not generate a response.";

            sendEvent("delta", {
              text: fullText,
            });
          }

          const { error: assistantMessageError } =
            await supabase.from("messages").insert({
              conversation_id: currentConversationId,
              role: "assistant",
              content: fullText,
            });

          if (assistantMessageError) {
            throw assistantMessageError;
          }

          sendEvent("done", {
            message: fullText,
          });

          controller.close();
        } catch (error) {
          console.error("CHAT STREAM ERROR:", error);

          sendEvent("error", {
            error: "Failed to generate response",
          });

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("CHAT API ERROR:", error);

    return NextResponse.json(
      { error: "Failed to start chat request" },
      { status: 500 },
    );
  }
}
