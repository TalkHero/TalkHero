"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  Loader2,
  Volume2,
} from "lucide-react";

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

function isImageAvatar(
  avatar: string,
): boolean {
  return avatar.startsWith("/");
}

export function NPCCard({
  npc,
  children,
  showListenButton = false,
  listening = false,
  onListen,
}: NPCCardProps) {
  const imageAvatar =
    isImageAvatar(npc.avatar);

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        "rounded-[28px]",
        "border border-slate-200/70",
        "bg-slate-100",
        "shadow-[0_16px_48px_rgba(15,23,42,0.08)]",
        "dark:border-slate-800 dark:bg-slate-900",
      )}
    >
      <div className="relative min-h-[330px] sm:min-h-[390px]">
        {imageAvatar ? (
          <Image
            src={npc.avatar}
            alt={npc.name}
            fill
            sizes="(max-width: 767px) 100vw, 896px"
            className="object-cover object-center"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-100 dark:from-slate-900 dark:to-indigo-950">
            <span
              className="text-[120px]"
              aria-hidden="true"
            >
              {npc.avatar}
            </span>
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
          aria-hidden="true"
        />

        <div
          className={cn(
            "absolute bottom-5 right-4 z-10",
            "w-[68%] max-w-[410px]",
            "rounded-[24px]",
            "bg-white/96",
            "px-4 py-3.5",
            "shadow-[0_14px_34px_rgba(15,23,42,0.18)]",
            "backdrop-blur-md",
            "sm:bottom-7 sm:right-7",
            "sm:px-5 sm:py-4",
            "dark:bg-slate-950/96",
          )}
        >
          <span
            className={cn(
              "absolute bottom-8 -left-2.5",
              "size-5 rotate-45",
              "bg-white/96",
              "dark:bg-slate-950/96",
            )}
            aria-hidden="true"
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  {npc.name}
                </p>

                {npc.role ? (
                  <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
                    {npc.role}
                  </p>
                ) : null}
              </div>

              {showListenButton ? (
                <button
                  type="button"
                  disabled={!onListen || listening}
                  onClick={onListen}
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center",
                    "rounded-full border border-indigo-200",
                    "bg-white text-indigo-600",
                    "shadow-sm transition",
                    "hover:bg-indigo-50",
                    "focus-visible:outline-none",
                    "focus-visible:ring-4 focus-visible:ring-indigo-100",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    "dark:border-indigo-800",
                    "dark:bg-slate-900 dark:text-indigo-300",
                  )}
                  aria-label={
                    listening
                      ? "Відтворюється репліка"
                      : `Прослухати репліку ${npc.name}`
                  }
                >
                  {listening ? (
                    <Loader2
                      className="size-4.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Volume2
                      className="size-4.5"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ) : null}
            </div>

            <div className="mt-2 whitespace-pre-line text-[16px] font-medium leading-6.5 text-slate-900 sm:text-lg sm:leading-7 dark:text-white">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
