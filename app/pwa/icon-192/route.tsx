import { createTalkHeroIcon } from "@/lib/pwa/createTalkHeroIcon";

export const runtime = "edge";

export function GET() {
  return createTalkHeroIcon({
    size: 192,
  });
}
