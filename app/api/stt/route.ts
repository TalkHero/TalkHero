"server-only";

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Потрібно увійти до облікового запису.",
        },
        { status: 401 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("STT: змінна OPENAI_API_KEY не налаштована.");

      return NextResponse.json(
        {
          error: "Розпізнавання голосу тимчасово не налаштоване.",
        },
        { status: 503 },
      );
    }

    const incoming = await request.formData();
    const audio = incoming.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        {
          error: "Аудіозапис не передано.",
        },
        { status: 400 },
      );
    }

    if (audio.size <= 0) {
      return NextResponse.json(
        {
          error: "Аудіозапис порожній.",
        },
        { status: 400 },
      );
    }

    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        {
          error: "Аудіозапис занадто великий.",
        },
        { status: 413 },
      );
    }

    const normalizedType = audio.type.split(";")[0].trim().toLowerCase();

    if (normalizedType && !ALLOWED_AUDIO_TYPES.has(normalizedType)) {
      return NextResponse.json(
        {
          error: "Цей формат аудіо не підтримується.",
        },
        { status: 415 },
      );
    }

    const openAIForm = new FormData();

    openAIForm.append("file", audio, audio.name || "voice-answer.webm");
    openAIForm.append("model", "gpt-4o-mini-transcribe");
    openAIForm.append("response_format", "json");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: openAIForm,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("ПОМИЛКА OPENAI STT:", response.status, errorText);

      return NextResponse.json(
        {
          error: "Не вдалося розпізнати голос.",
        },
        { status: 502 },
      );
    }

    const result = (await response.json()) as {
      text?: unknown;
    };

    const text = typeof result.text === "string" ? result.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        {
          error: "Не вдалося розпізнати слова. Спробуйте говорити чіткіше.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      text,
    });
  } catch (error) {
    console.error("ПОМИЛКА МАРШРУТУ STT:", error);

    return NextResponse.json(
      {
        error: "Не вдалося обробити голосову відповідь.",
      },
      { status: 500 },
    );
  }
}
