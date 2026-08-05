import Link from "next/link";

import { cn } from "@/lib/utils";

type TalkHeroWordmarkProps = {
  className?: string;
  href?: string;
  showTagline?: boolean;
};

export function TalkHeroWordmark({
  className,
  href = "/dashboard",
  showTagline = false,
}: TalkHeroWordmarkProps) {
  const content = (
    <span className={cn("inline-flex flex-col", className)}>
      <span className="inline-flex items-baseline text-2xl font-bold tracking-tight">
        <span className="text-foreground">Talk</span>
        <span className="talkhero-wordmark-gradient">Hero</span>
      </span>

      {showTagline ? (
        <span className="mt-1 text-xs font-medium tracking-wide text-muted-foreground">
          Speak. Learn. Become.
        </span>
      ) : null}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      aria-label="TalkHero — перейти на головну сторінку"
      className="talkhero-focus inline-flex rounded-sm"
    >
      {content}
    </Link>
  );
}
