"use client";

import {
  ArrowRight,
  BookOpen,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PublicQuestScene } from "@/lib/quests";

import { SceneShell } from "./SceneShell";

type NarrationSceneProps = {
  scene: PublicQuestScene;
  loading?: boolean;
  onContinue: () => void;
};

export function NarrationScene({
  scene,
  loading = false,
  onContinue,
}: NarrationSceneProps) {
  return (
    <SceneShell
      footer={
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={loading}
            onClick={onContinue}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2
                  className="animate-spin"
                  aria-hidden="true"
                />
                Завантаження…
              </>
            ) : (
              <>
                Продовжити
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      }
    >
      <section
        className="
          overflow-hidden rounded-3xl
          border border-indigo-100
          bg-gradient-to-br
          from-indigo-50/80 via-white to-violet-50/70
          shadow-sm
          dark:border-indigo-900/50
          dark:from-indigo-950/30
          dark:via-background
          dark:to-violet-950/20
        "
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div
              className="
                flex size-11 shrink-0 items-center justify-center
                rounded-2xl
                bg-indigo-100 text-indigo-700
                dark:bg-indigo-900/50 dark:text-indigo-300
              "
            >
              <BookOpen
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <p
                className="
                  mb-2 text-xs font-bold uppercase
                  tracking-[0.18em]
                  text-indigo-600
                  dark:text-indigo-300
                "
              >
                Історія
              </p>

              <p
                className="
                  whitespace-pre-line
                  text-lg leading-8
                  text-foreground
                  sm:text-xl
                "
              >
                {scene.content}
              </p>
            </div>
          </div>
        </div>
      </section>
    </SceneShell>
  );
}
