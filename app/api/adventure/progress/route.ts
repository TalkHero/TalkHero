"server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAdventureCampaignProgress,
} from "@/lib/adventure/progress";

const QuerySchema = z.object({
  campaign:
    z.string().trim().min(1).max(120),
});

export async function GET(
  request: Request,
) {
  try {
    const url = new URL(request.url);

    const { campaign } =
      QuerySchema.parse({
        campaign:
          url.searchParams.get(
            "campaign",
          ),
      });

    const progress =
      await getAdventureCampaignProgress(
        campaign,
      );

    return NextResponse.json(progress);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error:
            "Некоректний запит прогресу кампанії.",
        },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "AUTHENTICATION_REQUIRED"
    ) {
      return NextResponse.json(
        {
          error:
            "Потрібно увійти до облікового запису.",
        },
        { status: 401 },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "CAMPAIGN_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "Кампанію не знайдено.",
        },
        { status: 404 },
      );
    }

    console.error(
      "ПОМИЛКА ЗАВАНТАЖЕННЯ ПРОГРЕСУ ПРИГОДИ:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Не вдалося завантажити прогрес пригоди.",
      },
      { status: 500 },
    );
  }
}
