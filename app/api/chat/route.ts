import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const { message } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an English teacher. Speak only English unless grammar explanations are needed.",
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  return NextResponse.json({
    answer: completion.choices[0].message.content,
  });
}
