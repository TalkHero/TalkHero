"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, MousePointerClick } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PublicQuestScene } from "@/lib/quests";
import { cn } from "@/lib/utils";

import { SceneShell } from "./SceneShell";

type ChoiceOption = {
  id?: string;
  value?: unknown;
  label?: string;
  text?: string;
};

type ChoiceSceneProps = {
  scene: PublicQuestScene;
  loading?: boolean;
  onSubmit: (value: unknown) => Promise<void>;
};

function getOptionLabel(option: ChoiceOption, index: number): string {
  return (
    option.label ??
    option.text ??
    String(option.value ?? option.id ?? index + 1)
  );
}

export function ChoiceScene({
  scene,
  loading = false,
  onSubmit,
}: ChoiceSceneProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const options = (scene.options as ChoiceOption[]) ?? [];

  useEffect(() => {
    setSelectedIndex(null);
  }, [scene.id]);

  async function handleSubmit() {
    if (selectedIndex === null || loading) {
      return;
    }

    const option = options[selectedIndex];

    if (!option) {
      return;
    }

    await onSubmit(option.id ?? option.value ?? String(selectedIndex + 1));
  }

  function handleOptionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (loading || options.length === 0) {
      return;
    }

    let nextIndex: number | null = null;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (index + 1) % options.length;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (index - 1 + options.length) % options.length;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    setSelectedIndex(nextIndex);

    document.getElementById(`choice-option-${scene.id}-${nextIndex}`)?.focus();
  }

  return (
    <SceneShell
      title={scene.prompt}
      description={scene.content}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Оберіть один варіант відповіді
          </p>

          <Button
            type="button"
            disabled={selectedIndex === null || loading}
            onClick={() => {
              void handleSubmit();
            }}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Перевіряємо…
              </>
            ) : (
              <>
                Перевірити відповідь
                <Check aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MousePointerClick className="size-4" aria-hidden="true" />
        Натисніть на варіант, який вважаєте правильним
      </div>

      {options.length > 0 ? (
        <div
          role="radiogroup"
          aria-label="Варіанти відповіді"
          className="space-y-3"
        >
          {options.map((option, index) => {
            const label = getOptionLabel(option, index);

            const active = selectedIndex === index;

            return (
              <button
                id={`choice-option-${scene.id}-${index}`}
                key={option.id ?? `${scene.id}-${index}`}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={loading}
                onClick={() => {
                  setSelectedIndex(index);
                }}
                onKeyDown={(event) => {
                  handleOptionKeyDown(event, index);
                }}
                className={cn(
                  "group w-full rounded-xl border p-4 text-left",
                  "transition-[transform,background-color,border-color,box-shadow] duration-150",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  active
                    ? "border-primary bg-primary-soft shadow-sm"
                    : "border-border bg-card hover:-translate-y-px hover:border-primary/30 hover:bg-primary-soft/40 hover:shadow-card-hover",
                )}
              >
                <span className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                      "transition-colors duration-150",
                      active
                        ? "border-primary bg-primary"
                        : "border-input bg-card group-hover:border-primary/50",
                    )}
                  >
                    {active ? (
                      <Check className="size-3.5 text-primary-foreground" />
                    ) : null}
                  </span>

                  <span
                    className={cn(
                      "min-w-0 text-base font-medium leading-6",
                      active ? "text-foreground" : "text-foreground/90",
                    )}
                  >
                    {label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div
          role="alert"
          className="rounded-xl border border-warning/20 bg-warning-soft p-5 text-sm text-amber-800"
        >
          Для цієї сцени не налаштовано варіанти відповіді.
        </div>
      )}
    </SceneShell>
  );
}
