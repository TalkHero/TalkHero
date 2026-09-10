"server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

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
  text: z.string().trim().min(1).max(600),
  voice: z.enum(ALLOWED_VOICES).default("nova"),
  instructions: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("DEMO TTS: OPENAI_API_KEY is not configured.");

      return NextResponse.json(
        {
          error: "Озвучення тимчасово недоступне.",
        },
        { status: 503 },
      );
    }

    const payload = RequestSchema.parse(await request.json());

    const response = await fetch(
      "https://api.openai.com/v1/audio/speech",
      {
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
            [
              "Speak natural British English.",
              "Use a warm, lively, friendly female tutor voice.",
              "Speak at a comfortable conversational pace.",
              "Use clear pronunciation and natural intonation.",
              "Do not sound robotic or overly slow.",
            ].join(" "),
          response_format: "mp3",
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "DEMO TTS OPENAI ERROR:",
        response.status,
        errorText,
      );

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
          error: "Сервіс озвучення не повернув аудіо.",
        },
        { status: 502 },
      );
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ?? "audio/mpeg",
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

    console.error("DEMO TTS ROUTE ERROR:", error);

    return NextResponse.json(
      {
        error: "Не вдалося відтворити голос.",
      },
      { status: 500 },
    );
  }
}
