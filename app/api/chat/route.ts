import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildTutorPrompt } from "@/lib/ai/tutor/build-tutor-prompt";
import type { EnglishLevel } from "@/lib/ai/tutor/types";
import {
  analyzeAndSaveErrors,
  buildErrorMemoryPrompt,
  buildReinforcementPrompt,
  checkAndUpdateMastery,
  loadErrors,
} from "@/lib/ai/error-memory";
import { getCurrentLesson } from "@/lib/ai/curriculum/get-current-lesson";
import { API_ERRORS, UI_ERRORS } from "@/lib/i18n/errors";
import { awardXp } from "@/lib/progress/awardXp";
import { createClient } from "@/lib/supabase/server";
import { analyzeAndSaveUserMemories } from "@/lib/ai/user-memory/analyze-and-save-memories";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatRequest = {
  message?: string;
  conversationId?: string | null;
};

type Profile = {
  full_name: string | null;
  native_language: string | null;
  target_language: string | null;
  english_level: string | null;
};

type UserMemory = {
  memory_key: string;
  memory_value: string;
  category: string;
  confidence: number;
};

type UnlockedAchievement = {
  achievement_id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked_at: string;
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

function normalizeEnglishLevel(value: string | null | undefined): EnglishLevel {
  const normalized = value?.trim().toUpperCase() as EnglishLevel;

  return VALID_ENGLISH_LEVELS.includes(normalized) ? normalized : "A1";
}

function getLanguageName(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  return LANGUAGE_NAMES[normalized] ?? value.trim();
}

function normalizeConversationTitle(value: string | null | undefined) {
  const normalized = value
    ?.replace(/^["'«»„“”]+|["'«»„“”]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "Нова розмова";
  }

  return normalized.slice(0, 60);
}

async function generateConversationTitle(
  assistantMessage: string,
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    max_tokens: 30,
    messages: [
      {
        role: "system",
        content: [
          "Створи коротку українську назву для розмови з викладачем англійської.",
          "Назва повинна описувати тему, з якої починає викладач.",
          "Використай від 2 до 5 слів.",
          "Не додавай лапки, крапку, двокрапку, пояснення або емодзі.",
          "Поверни лише назву.",
        ].join("\n"),
      },
      {
        role: "user",
        content: assistantMessage,
      },
    ],
  });

  return normalizeConversationTitle(completion.choices[0]?.message?.content);
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
        {
          error: API_ERRORS.unauthorized,
        },
        {
          status: 401,
        },
      );
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, native_language, target_language, english_level")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("PROFILE ERROR:", profileError);
    }

    const profile = profileData as Profile | null;

    const englishLevel = normalizeEnglishLevel(profile?.english_level);

    const fullName =
      profile?.full_name?.trim() || user.email?.split("@")[0] || "the student";

    const nativeLanguage = getLanguageName(
      profile?.native_language,
      "Ukrainian",
    );

    const targetLanguage = getLanguageName(profile?.target_language, "English");

    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        {
          error: API_ERRORS.messageRequired,
        },
        {
          status: 400,
        },
      );
    }

    let conversationId = body.conversationId ?? null;
    let isNewConversation = false;

    if (conversationId) {
      const { data: conversation, error: conversationError } = await supabase
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
          {
            error: API_ERRORS.conversationNotFound,
          },
          {
            status: 404,
          },
        );
      }
    } else {
      conversationId = crypto.randomUUID();
      isNewConversation = true;

      const { error: createConversationError } = await supabase
        .from("conversations")
        .insert({
          id: conversationId,
          user_id: user.id,
          title: "Нова розмова",
          title_locked: false,
        });

      if (createConversationError) {
        throw createConversationError;
      }
    }

    const { error: userMessageError } = await supabase.from("messages").insert({
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
      .order("created_at", {
        ascending: false,
      })
      .limit(40);

    if (historyError) {
      throw historyError;
    }

    const orderedHistory = [...(history ?? [])].reverse();

    let userMemoryPrompt = "";

    try {
      const { data: memories, error: memoriesError } = await supabase
        .from("user_memories")
        .select("memory_key, memory_value, category, confidence")
        .eq("user_id", user.id)
        .gte("confidence", 0.6)
        .order("updated_at", {
          ascending: false,
        })
        .limit(30);

      if (memoriesError) {
        throw memoriesError;
      }

      const userMemories = (memories ?? []) as UserMemory[];

      if (userMemories.length > 0) {
        const memoryLines = userMemories.map(
          (memory) => `- ${memory.memory_key}: ${memory.memory_value}`,
        );

        userMemoryPrompt = `
LONG-TERM USER MEMORY

These are previously learned facts about the student.

Use them naturally when relevant.

Do not mention that you are reading memory or stored data.

Do not repeat questions when the answer is already known from these memories.

Do not force memories into unrelated conversation.

If the student's current message contradicts an old memory, trust the current message.

Known facts:

${memoryLines.join("\n")}
`.trim();
      }
    } catch (memoryLoadError) {
      console.error("CHAT USER MEMORY LOAD ERROR:", memoryLoadError);
    }

    const currentLesson = getCurrentLesson(englishLevel);

    let errorMemoryPrompt = "";

    try {
      const previousErrors = await loadErrors(user.id);

      errorMemoryPrompt = [
        buildErrorMemoryPrompt(previousErrors),
        buildReinforcementPrompt(previousErrors),
      ]
        .filter(Boolean)
        .join("\n\n");
    } catch (errorMemoryLoadError) {
      console.error("CHAT ERROR MEMORY LOAD ERROR:", errorMemoryLoadError);
    }

    const tutorPrompt = buildTutorPrompt({
      profile: {
        fullName,
        nativeLanguage,
        targetLanguage,
        level: englishLevel,
      },
      lesson: currentLesson,
    });

    const systemPrompt = [tutorPrompt, userMemoryPrompt, errorMemoryPrompt]
      .filter(Boolean)
      .join("\n\n");

    const encoder = new TextEncoder();
    const currentConversationId = conversationId;

    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        let generatedConversationTitle: string | null = null;
        let streamClosed = false;

        function sendEvent(event: string, data: Record<string, unknown>) {
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
            lesson: {
              id: currentLesson.id,
              title: currentLesson.title,
              topic: currentLesson.topic,
              unit: currentLesson.unit,
              lesson: currentLesson.lesson,
            },
          });

          const completionStream = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            stream: true,
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              ...orderedHistory.map((item) => ({
                role: item.role as "user" | "assistant",
                content: item.content,
              })),
            ],
          });

          for await (const chunk of completionStream) {
            const text = chunk.choices[0]?.delta?.content ?? "";

            if (!text) {
              continue;
            }

            fullText += text;

            sendEvent("delta", {
              text,
            });
          }

          if (!fullText.trim()) {
            fullText = UI_ERRORS.emptyAssistantResponse;

            sendEvent("delta", {
              text: fullText,
            });
          }

          const { error: assistantMessageError } = await supabase
            .from("messages")
            .insert({
              conversation_id: currentConversationId,
              role: "assistant",
              content: fullText,
            });

          if (assistantMessageError) {
            throw assistantMessageError;
          }

          const [
            errorAnalysisResult,
            masteryAnalysisResult,
            memoryAnalysisResult,
          ] = await Promise.allSettled([
            analyzeAndSaveErrors({
              userId: user.id,
              userMessage: message,
              assistantMessage: fullText,
            }),

            checkAndUpdateMastery({
              userId: user.id,
              userMessage: message,
            }),

            analyzeAndSaveUserMemories({
              userId: user.id,
              conversationId: currentConversationId,
              userMessage: message,
              assistantMessage: fullText,
            }),
          ]);
          if (errorAnalysisResult.status === "rejected") {
            console.error(
              "CHAT ERROR MEMORY ANALYSIS ERROR:",
              errorAnalysisResult.reason,
            );
          }

          if (masteryAnalysisResult.status === "rejected") {
            console.error(
              "CHAT MASTERY ANALYSIS ERROR:",
              masteryAnalysisResult.reason,
            );
          }

          if (memoryAnalysisResult.status === "rejected") {
            console.error(
              "CHAT USER MEMORY ANALYSIS ERROR:",
              memoryAnalysisResult.reason,
            );
          }

          if (isNewConversation) {
            try {
              generatedConversationTitle =
                await generateConversationTitle(fullText);

              const { error: titleUpdateError } = await supabase
                .from("conversations")
                .update({
                  title: generatedConversationTitle,
                })
                .eq("id", currentConversationId)
                .eq("user_id", user.id)
                .eq("title_locked", false);

              if (titleUpdateError) {
                throw titleUpdateError;
              }

              sendEvent("conversation-title", {
                conversationId: currentConversationId,
                title: generatedConversationTitle,
              });
            } catch (titleError) {
              console.error("CHAT CONVERSATION TITLE ERROR:", titleError);
            }
          }

          let progress = null;
          let xpAwarded = 0;

          try {
            progress = await awardXp({
              userId: user.id,
              amount: 5,
            });

            xpAwarded += 5;
          } catch (progressError) {
            console.error("CHAT XP ERROR:", progressError);
          }

          let streak = null;

          try {
            const { data: streakData, error: streakError } = await supabase.rpc(
              "update_daily_streak",
            );

            if (streakError) {
              throw streakError;
            }

            streak = streakData?.[0] ?? null;
          } catch (streakError) {
            console.error("CHAT STREAK ERROR:", streakError);
          }

          let unlockedAchievements: UnlockedAchievement[] = [];

          try {
            const { data: achievementData, error: achievementError } =
              await supabase.rpc("check_and_unlock_achievements");

            if (achievementError) {
              throw achievementError;
            }

            unlockedAchievements =
              (achievementData as UnlockedAchievement[] | null) ?? [];
          } catch (achievementError) {
            console.error("CHAT ACHIEVEMENT ERROR:", achievementError);
          }

          const achievementXpReward = unlockedAchievements.reduce(
            (total, achievement) => total + achievement.xp_reward,
            0,
          );

          if (achievementXpReward > 0) {
            try {
              progress = await awardXp({
                userId: user.id,
                amount: achievementXpReward,
              });

              xpAwarded += achievementXpReward;
            } catch (achievementXpError) {
              console.error("CHAT ACHIEVEMENT XP ERROR:", achievementXpError);
            }
          }

          sendEvent("done", {
            message: fullText,
            conversationTitle: generatedConversationTitle,
            englishLevel,
            lesson: {
              id: currentLesson.id,
              title: currentLesson.title,
              topic: currentLesson.topic,
              unit: currentLesson.unit,
              lesson: currentLesson.lesson,
            },
            xpAwarded,
            progress,
            streak,
            achievements: unlockedAchievements,
          });

          streamClosed = true;
          controller.close();
        } catch (error) {
          console.error("CHAT STREAM ERROR:", error);

          sendEvent("error", {
            error: API_ERRORS.failedToGenerateResponse,
          });

          streamClosed = true;
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("CHAT API ERROR:", error);

    return NextResponse.json(
      {
        error: API_ERRORS.failedToStartChatRequest,
      },
      {
        status: 500,
      },
    );
  }
}
