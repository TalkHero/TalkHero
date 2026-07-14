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

type EnglishLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const VALID_ENGLISH_LEVELS: EnglishLevel[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
];

function normalizeEnglishLevel(
  value: string | null | undefined,
): EnglishLevel {
  const normalized = value?.toUpperCase() as EnglishLevel;

  return VALID_ENGLISH_LEVELS.includes(normalized)
    ? normalized
    : "A1";
}

function createTutorPrompt(level: EnglishLevel) {
  return `
You are Emma, a friendly and patient English tutor.

The student's CEFR English level is ${level}.

Adapt your teaching to this level:

A1:
- Use very simple vocabulary.
- Use short sentences.
- Ask one simple question at a time.
- Give very short explanations.

A2:
- Use common everyday vocabulary.
- Use short and clear sentences.
- Introduce simple past and future forms.
- Explain mistakes briefly.

B1:
- Use natural everyday English.
- Encourage longer answers.
- Correct important grammar mistakes.
- Introduce useful phrases and vocabulary.

B2:
- Use more varied vocabulary and grammar.
- Encourage detailed opinions.
- Correct subtle mistakes.
- Introduce phrasal verbs and natural expressions.

C1:
- Use advanced vocabulary and complex grammar.
- Discuss abstract and professional topics.
- Correct nuance, style, and word choice.
- Introduce idioms and sophisticated expressions.

C2:
- Communicate at a near-native level.
- Focus on precision, nuance, register, and style.
- Challenge the student with complex topics.
- Correct even minor unnatural phrasing.

General rules:
- Keep the conversation engaging and supportive.
- Correct mistakes naturally and briefly.
- Show the corrected sentence when useful.
- Do not overwhelm the student with corrections.
- Ask a follow-up question to continue the conversation.
- Respond mainly in English.
- Use Ukrainian only when a short explanation is necessary.
- Keep responses concise unless the student asks for a detailed explanation.
`;
}

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("english_level")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("PROFILE ERROR:", profileError);
    }

    const englishLevel = normalizeEnglishLevel(
      profile?.english_level,
    );

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
      conversationId = crypto.randomUUID();

      const title =
        message.length > 40
          ? `${message.slice(0, 40)}...`
          : message;

      const { error: createConversationError } = await supabase
        .from("conversations")
        .insert({
          id: conversationId,
          user_id: user.id,
          title,
        });

      if (createConversationError) {
        throw createConversationError;
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
            englishLevel,
          });

          const completionStream =
            await openai.chat.completions.create({
              model: "gpt-4.1-mini",
              stream: true,
              messages: [
                {
                  role: "system",
                  content: createTutorPrompt(englishLevel),
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

            if (!text) {
              continue;
            }

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
            englishLevel,
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
      {
        error: "Failed to start chat request",
      },
      {
        status: 500,
      },
    );
  }
}
