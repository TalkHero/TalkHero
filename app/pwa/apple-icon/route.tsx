import { createTalkHeroIcon } from "@/lib/pwa/createTalkHeroIcon";

export const runtime = "nodejs";

export function GET() {
  return createTalkHeroIcon({
    size: 180,
    maskable: true,
  });
}
