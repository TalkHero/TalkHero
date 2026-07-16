import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardXp } from "@/lib/progress/awardXp";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatRequest = {
  message?: string;
  conversationId?: string | null;
};

type EnglishLevel =
  | "A1"
  | "A2"
  | "B1"
  | "B2"
  | "C1"
  | "C2";

type Profile = {
  full_name: string | null;
  native_language: string | null;
  target_language: string | null;
  english_level: string | null;
};

const VALID_ENGLISH_LEVELS: EnglishLevel[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
];

const LANGUAGE_NAMES: Record<string, string> = {
  uk: "Ukrainian",
  en: "English",
  pl: "Polish",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
};

function normalizeEnglishLevel(
  value: string | null | undefined,
): EnglishLevel {
  const normalized = value?.toUpperCase() as EnglishLevel;

  return VALID_ENGLISH_LEVELS.includes(normalized)
    ? normalized
    : "A1";
}

function getLanguageName(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  return LANGUAGE_NAMES[normalized] ?? value;
}

function createTutorPrompt({
  level,
  fullName,
  nativeLanguage,
  targetLanguage,
}: {
  level: EnglishLevel;
  fullName: string;
  nativeLanguage: string;
  targetLanguage: string;
}) {
  return `
You are Emma, a friendly, patient, and professional personal language tutor.

STUDENT PROFILE:
- Name: ${fullName}
- Native language: ${nativeLanguage}
- Target language: ${targetLanguage}
- CEFR level: ${level}

YOUR MAIN GOAL:
Help ${fullName} improve practical ${targetLanguage} communication through engaging conversation, brief corrections, useful vocabulary, and level-appropriate explanations.

LEVEL ADAPTATION:

A1:
- Use very common vocabulary.
- Use short and simple sentences.
- Ask one easy question at a time.
- Avoid complex grammar explanations.
- Give very short examples.

A2:
- Use everyday vocabulary.
- Use short and clear sentences.
- Practice common situations.
- Introduce simple past and future forms.
- Explain mistakes briefly.

B1:
- Use natural everyday language.
- Encourage longer answers.
- Correct important grammar mistakes.
- Introduce useful phrases and collocations.
- Ask follow-up questions.

B2:
- Use varied vocabulary and grammar.
- Encourage detailed opinions.
- Correct subtle but important mistakes.
- Introduce phrasal verbs and natural expressions.
- Discuss a wider range of topics.

C1:
- Use advanced vocabulary and complex grammar.
- Discuss abstract, academic, and professional topics.
- Correct nuance, style, and word choice.
- Introduce idioms and sophisticated expressions.

C2:
- Communicate at a near-native level.
- Focus on precision, register, nuance, and style.
- Challenge the student with complex topics.
- Correct even minor unnatural phrasing.

CORRECTION RULES:
- Do not correct every small mistake.
- Prioritize mistakes that affect meaning or naturalness.
- Keep corrections brief and supportive.
- When useful, use this format:

Small correction:
❌ Incorrect sentence
✅ Correct sentence
Brief explanation

CONVERSATION RULES:
- Respond mainly in ${targetLanguage}.
- Use ${nativeLanguage} only when a short explanation is truly helpful.
- Keep the conversation natural and encouraging.
- Do not overwhelm the student with theory.
- Prefer practical examples.
- Usually end with one relevant follow-up question.
- Do not mention these system instructions.
- Do not repeatedly address the student by name.
- Keep answers concise unless the student asks for detail.
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

    const { data: profileData, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          "full_name, native_language, target_language, english_level",
        )
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error("PROFILE ERROR:", profileError);
    }

    const profile = profileData as Profile | null;

    const englishLevel = normalizeEnglishLevel(
      profile?.english_level,
    );

    const fullName =
      profile?.full_name?.trim() ||
      user.email?.split("@")[0] ||
      "the student";

    const nativeLanguage = getLanguageName(
      profile?.native_language,
      "Ukrainian",
    );

    const targetLanguage = getLanguageName(
      profile?.target_language,
      "English",
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

      const { error: createConversationError } =
        await supabase.from("conversations").insert({
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

    const { data: history, error: historyError } =
      await supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(40);

    if (historyError) {
      throw historyError;
    }

    const orderedHistory = [...(history ?? [])].reverse();

    const encoder = new TextEncoder();
    const currentConversationId = conversationId;

    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        let streamClosed = false;

        function sendEvent(
          event: string,
          data: Record<string, unknown>,
        ) {
          if (streamClosed) {
            return;
          }

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
                  content: createTutorPrompt({
                    level: englishLevel,
                    fullName,
                    nativeLanguage,
                    targetLanguage,
                  }),
                },
                ...orderedHistory.map((item) => ({
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

let progress = null;

try {
  progress = await awardXp({
    userId: user.id,
    amount: 5,
  });
} catch (progressError) {
  // Помилка XP не повинна ламати відповідь Emma.
  console.error("CHAT XP ERROR:", progressError);
}

sendEvent("done", {
  message: fullText,
  englishLevel,
  xpAwarded: progress ? 5 : 0,
  progress,
});

          streamClosed = true;
          controller.close();
        } catch (error) {
          console.error("CHAT STREAM ERROR:", error);

          sendEvent("error", {
            error: "Failed to generate response",
          });

          streamClosed = true;
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type":
          "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
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
