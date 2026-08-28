"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  Headphones,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type {
  NPC,
  NPCEmotion,
} from "@/lib/quests/npcs";
import { cn } from "@/lib/utils";

type NPCCardProps = {
  npc: NPC;
  children: ReactNode;
  emotion?: NPCEmotion;
  showListenButton?: boolean;
  listening?: boolean;
  onListen?: () => void;
};

const THEME_CLASSES: Record<
  NPC["theme"],
  {
    card: string;
    avatar: string;
  }
> = {
  violet: {
    card: "border-violet-200 bg-gradient-to-br from-violet-50/80 via-white to-white",
    avatar: "bg-violet-100 text-violet-700",
  },
  emerald: {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-white",
    avatar: "bg-emerald-100 text-emerald-700",
  },
  blue: {
    card: "border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-white",
    avatar: "bg-blue-100 text-blue-700",
  },
  amber: {
    card: "border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-white",
    avatar: "bg-amber-100 text-amber-700",
  },
  rose: {
    card: "border-rose-200 bg-gradient-to-br from-rose-50/80 via-white to-white",
    avatar: "bg-rose-100 text-rose-700",
  },
  slate: {
    card: "border-border bg-gradient-to-br from-muted/70 via-white to-white",
    avatar: "bg-muted text-foreground",
  },
};

const EMOTION_LABELS: Record<
  NPCEmotion,
  string
> = {
  happy: "Доброзичливий настрій",
  neutral: "Спокійний настрій",
  thinking: "Замислений настрій",
  surprised: "Здивований настрій",
  encouraging: "Підтримує вас",
  celebrating: "Святкує успіх",
};

function isImageAvatar(avatar: string): boolean {
  return avatar.startsWith("/");
}

export function NPCCard({
  npc,
  children,
  emotion = npc.emotion,
  showListenButton = false,
  listening = false,
  onListen,
}: NPCCardProps) {
  const theme = THEME_CLASSES[npc.theme];
  const imageAvatar = isImageAvatar(npc.avatar);

  return (
    <Card
      className={cn(
        "overflow-hidden",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        theme.card,
      )}
    >
      <CardHeader className="border-b border-black/5 p-6 sm:p-7">
        <div
          className={cn(
            "grid items-center gap-5",
            "grid-cols-[104px_minmax(0,1fr)]",
            "sm:grid-cols-[160px_minmax(0,1fr)_auto]",
            "sm:gap-7",
          )}
        >
          {/* Character portrait */}
          <div
            className={cn(
              "relative flex size-[104px] shrink-0 items-center justify-center",
              "overflow-hidden rounded-2xl shadow-sm",
              "sm:size-[160px]",
              "text-4xl sm:text-5xl",
              theme.avatar,
            )}
          >
            {imageAvatar ? (
              <Image
                src={npc.avatar}
                alt={npc.name}
                fill
                sizes="(max-width: 639px) 104px, 160px"
                className="object-cover object-top"
                priority={false}
              />
            ) : (
              <span aria-hidden="true">
                {npc.avatar}
              </span>
            )}
          </div>

          {/* Character information */}
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {npc.name}
            </h2>

            <p className="mt-1 truncate text-sm text-muted-foreground sm:text-base">
              {npc.role}
            </p>
          </div>

          {/* Controls — desktop */}
          <div className="hidden shrink-0 flex-col items-end gap-3 sm:flex">
            <Badge variant="neutral">
              <Sparkles aria-hidden="true" />
              <span>
                {EMOTION_LABELS[emotion]}
              </span>
            </Badge>

            {showListenButton ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!onListen || listening}
                onClick={onListen}
                aria-label={
                  listening
                    ? "Відтворюється репліка персонажа"
                    : `Прослухати репліку персонажа ${npc.name}`
                }
              >
                {listening ? (
                  <Loader2
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Headphones aria-hidden="true" />
                )}

                <span>
                  {listening
                    ? "Відтворення…"
                    : "Прослухати"}
                </span>
              </Button>
            ) : null}
          </div>

          {/* Controls — mobile */}
          <div className="col-span-2 flex flex-wrap items-center gap-2 sm:hidden">
            <Badge variant="neutral">
              <Sparkles aria-hidden="true" />
              <span>Настрій</span>
            </Badge>

            {showListenButton ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!onListen || listening}
                onClick={onListen}
                aria-label={
                  listening
                    ? "Відтворюється репліка персонажа"
                    : `Прослухати репліку персонажа ${npc.name}`
                }
              >
                {listening ? (
                  <Loader2
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Headphones aria-hidden="true" />
                )}

                <span>
                  {listening
                    ? "Відтворення…"
                    : "Прослухати"}
                </span>
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-7 text-base leading-7 text-foreground sm:px-7 sm:py-8 sm:text-lg sm:leading-8">
        {children}
      </CardContent>
    </Card>
  );
}
