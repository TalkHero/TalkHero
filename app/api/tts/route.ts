"server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeApiRateLimit } from "@/lib/security/api-rate-limit";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar",
] as const;

const RequestSchema = z.object({
  text: z.string().trim().min(1).max(1200),
  voice: z.enum(ALLOWED_VOICES),
  instructions: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const totalStartedAt = performance.now();

  try {
    const authStartedAt = performance.now();

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.info(
      "TTS TIMING auth:",
      `${Math.round(performance.now() - authStartedAt)}ms`,
    );

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Потрібно увійти до облікового запису.",
        },
        { status: 401 },
      );
    }

    const rateLimitStartedAt = performance.now();

    const rateLimit = await consumeApiRateLimit(supabase, {
      bucket: "tts",
      limit: 20,
      windowSeconds: 60,
    });

    console.info(
      "TTS TIMING rate-limit:",
      `${Math.round(performance.now() - rateLimitStartedAt)}ms`,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Забагато запитів на озвучення. Спробуйте трохи пізніше.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("TTS: змінна OPENAI_API_KEY не налаштована.");

      return NextResponse.json(
        {
          error: "Озвучення тимчасово не налаштоване.",
        },
        { status: 503 },
      );
    }

    const payload = RequestSchema.parse(await request.json());

    const openAiStartedAt = performance.now();

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: payload.voice,
        input: payload.text,
        instructions:
          payload.instructions ||
          "Speak clearly and naturally at a comfortable conversational pace.",
        response_format: "mp3",
      }),
      cache: "no-store",
    });

    console.info(
      "TTS TIMING openai:",
      `${Math.round(performance.now() - openAiStartedAt)}ms`,
    );
    console.info(
      "TTS TIMING total-before-stream:",
      `${Math.round(performance.now() - totalStartedAt)}ms`,
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("OPENAI TTS ERROR:", response.status, errorText);

      return NextResponse.json(
        {
          error: "Не вдалося створити озвучення.",
        },
        { status: 502 },
      );
    }

    if (!response.body) {
      return NextResponse.json(
        {
          error: "Сервіс озвучення не повернув аудіопотік.",
        },
        { status: 502 },
      );
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "audio/mpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Некоректні дані для озвучення.",
        },
        { status: 400 },
      );
    }

    console.error("TTS ROUTE ERROR:", error);

    return NextResponse.json(
      {
        error: "Не вдалося відтворити голос.",
      },
      { status: 500 },
    );
  }
}
