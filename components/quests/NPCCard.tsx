"use client";

import type { ReactNode } from "react";
import {
  Headphones,
  Sparkles,
} from "lucide-react";

import type {
  NPC,
  NPCEmotion,
} from "@/lib/quests/npcs";

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
    border: string;
    background: string;
    avatar: string;
    badge: string;
  }
> = {
  violet: {
    border: "border-violet-200",
    background:
      "bg-gradient-to-br from-violet-50 to-white",
    avatar: "bg-violet-100 text-violet-700",
    badge: "bg-violet-100 text-violet-700",
  },
  emerald: {
    border: "border-emerald-200",
    background:
      "bg-gradient-to-br from-emerald-50 to-white",
    avatar: "bg-emerald-100 text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
  },
  blue: {
    border: "border-blue-200",
    background:
      "bg-gradient-to-br from-blue-50 to-white",
    avatar: "bg-blue-100 text-blue-700",
    badge: "bg-blue-100 text-blue-700",
  },
  amber: {
    border: "border-amber-200",
    background:
      "bg-gradient-to-br from-amber-50 to-white",
    avatar: "bg-amber-100 text-amber-700",
    badge: "bg-amber-100 text-amber-700",
  },
  rose: {
    border: "border-rose-200",
    background:
      "bg-gradient-to-br from-rose-50 to-white",
    avatar: "bg-rose-100 text-rose-700",
    badge: "bg-rose-100 text-rose-700",
  },
  slate: {
    border: "border-slate-200",
    background:
      "bg-gradient-to-br from-slate-50 to-white",
    avatar: "bg-slate-100 text-slate-700",
    badge: "bg-slate-100 text-slate-700",
  },
};

const EMOTION_LABELS: Record<
  NPCEmotion,
  string
> = {
  happy: "Доброзичлива",
  neutral: "Спокійний",
  thinking: "Замислений",
  surprised: "Здивований",
  encouraging: "Підтримує вас",
  celebrating: "Святкує успіх",
};

export function NPCCard({
  npc,
  children,
  emotion = npc.emotion,
  showListenButton = false,
  listening = false,
  onListen,
}: NPCCardProps) {
  const theme = THEME_CLASSES[npc.theme];

  return (
    <article
      className={[
        "overflow-hidden rounded-3xl border shadow-sm",
        theme.border,
        theme.background,
      ].join(" ")}
    >
      <header className="flex flex-col gap-4 border-b border-black/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className={[
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm",
              theme.avatar,
            ].join(" ")}
          >
            {npc.avatar}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {npc.name}
            </h2>

            <p className="text-sm text-slate-600">
              {npc.role}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
              theme.badge,
            ].join(" ")}
          >
            <Sparkles
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
            {EMOTION_LABELS[emotion]}
          </span>

          {showListenButton && (
            <button
              type="button"
              disabled={!onListen || listening}
              onClick={onListen}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Headphones
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />

              {listening
                ? "Відтворення…"
                : "Прослухати"}
            </button>
          )}
        </div>
      </header>

      <div className="px-5 py-6 text-base leading-7 text-slate-800 sm:px-6 sm:text-lg">
        {children}
      </div>
    </article>
  );
}
