"server-only";

import { NextResponse } from "next/server";

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

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
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("DEMO STT: OPENAI_API_KEY is missing.");

      return NextResponse.json(
        {
          error: "Розпізнавання голосу тимчасово недоступне.",
        },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        {
          error: "Аудіозапис не передано.",
        },
        { status: 400 },
      );
    }

    if (audio.size === 0) {
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

    const normalizedType = audio.type
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (
      normalizedType &&
      !ALLOWED_AUDIO_TYPES.has(normalizedType)
    ) {
      return NextResponse.json(
        {
          error: "Цей формат аудіо не підтримується.",
        },
        { status: 415 },
      );
    }

    const openAIFormData = new FormData();

    openAIFormData.append(
      "file",
      audio,
      audio.name || "demo-recording.webm",
    );

    openAIFormData.append(
      "model",
      "gpt-4o-mini-transcribe",
    );

    openAIFormData.append(
      "response_format",
      "json",
    );

    openAIFormData.append(
      "prompt",
      [
        "This is a short English learning conversation.",
        "Transcribe exactly what the student says.",
        "The student may speak English or Ukrainian.",
        "Preserve the language actually spoken.",
        "Do not translate.",
        "Do not correct grammar.",
        "Do not improve the sentence.",
      ].join(" "),
    );

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: openAIFormData,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "DEMO STT OPENAI ERROR:",
        response.status,
        errorText,
      );

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

    const text =
      typeof result.text === "string"
        ? result.text.trim()
        : "";

    if (!text) {
      return NextResponse.json(
        {
          error:
            "Не вдалося розпізнати слова. Спробуйте ще раз.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      text,
    });
  } catch (error) {
    console.error("DEMO STT ROUTE ERROR:", error);

    return NextResponse.json(
      {
        error: "Не вдалося обробити голосову відповідь.",
      },
      { status: 500 },
    );
  }
}
