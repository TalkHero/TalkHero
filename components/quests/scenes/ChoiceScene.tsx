"use client";

import {
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";

import {
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";

import {
  Button,
} from "@/components/ui/button";

import type {
  PublicQuestScene,
} from "@/lib/quests";

import {
  cn,
} from "@/lib/utils";

import {
  SceneShell,
} from "./SceneShell";

type ChoiceOption = {
  id?: string;
  value?: unknown;
  label?: string;
  text?: string;
};

type ChoiceSceneProps = {
  scene: PublicQuestScene;
  loading?: boolean;

  onSubmit: (
    value: unknown,
  ) => Promise<void>;
};

function getOptionLabel(
  option: ChoiceOption,
  index: number,
): string {
  return (
    option.label ??
    option.text ??
    String(
      option.value ??
        option.id ??
        index + 1,
    )
  );
}

export function ChoiceScene({
  scene,
  loading = false,
  onSubmit,
}: ChoiceSceneProps) {
  const [
    selectedIndex,
    setSelectedIndex,
  ] =
    useState<number | null>(
      null,
    );

  const options =
    (scene.options as ChoiceOption[]) ??
    [];

  useEffect(() => {
    setSelectedIndex(null);
  }, [
    scene.id,
  ]);

  async function handleSubmit() {
    if (
      selectedIndex === null ||
      loading
    ) {
      return;
    }

    const option =
      options[selectedIndex];

    if (!option) {
      return;
    }

    /*
     * ВАЖЛИВО:
     * зберігаємо існуючу семантику Quest Engine.
     */
    await onSubmit(
      option.id ??
        option.value ??
        String(
          selectedIndex + 1,
        ),
    );
  }

  function handleOptionKeyDown(
    event:
      KeyboardEvent<HTMLButtonElement>,

    index: number,
  ) {
    if (
      loading ||
      options.length === 0
    ) {
      return;
    }

    let nextIndex:
      | number
      | null = null;

    if (
      event.key ===
        "ArrowDown" ||
      event.key ===
        "ArrowRight"
    ) {
      nextIndex =
        (index + 1) %
        options.length;
    }

    if (
      event.key ===
        "ArrowUp" ||
      event.key ===
        "ArrowLeft"
    ) {
      nextIndex =
        (
          index -
          1 +
          options.length
        ) %
        options.length;
    }

    if (
      nextIndex === null
    ) {
      return;
    }

    event.preventDefault();

    setSelectedIndex(
      nextIndex,
    );

    document
      .getElementById(
        `choice-option-${scene.id}-${nextIndex}`,
      )
      ?.focus();
  }

  return (
    <SceneShell
      taskLabel="Твоє завдання"
      title={
        scene.prompt ||
        "Обери правильну відповідь"
      }
      description={
        scene.content ||
        null
      }
      footer={
        <Button
          type="button"
          disabled={
            selectedIndex ===
              null ||
            loading
          }
          onClick={() => {
            void handleSubmit();
          }}
          className="
            min-h-[52px] w-full
            rounded-full
            text-sm font-bold
          "
        >
          {loading ? (
            <>
              <Loader2
                className="size-4 animate-spin"
                aria-hidden="true"
              />

              Перевіряємо…
            </>
          ) : (
            <>
              Перевірити

              <ArrowRight
                className="size-4"
                aria-hidden="true"
              />
            </>
          )}
        </Button>
      }
    >
      {options.length > 0 ? (
        <div
          role="radiogroup"
          aria-label="Варіанти відповіді"
          className="space-y-2.5"
        >
          {options.map(
            (
              option,
              index,
            ) => {
              const label =
                getOptionLabel(
                  option,
                  index,
                );

              const active =
                selectedIndex ===
                index;

              const letter =
                String.fromCharCode(
                  65 + index,
                );

              return (
                <button
                  id={`choice-option-${scene.id}-${index}`}
                  key={
                    option.id ??
                    `${scene.id}-${index}`
                  }
                  type="button"
                  role="radio"
                  aria-checked={
                    active
                  }
                  disabled={
                    loading
                  }
                  onClick={() => {
                    setSelectedIndex(
                      index,
                    );
                  }}
                  onKeyDown={(
                    event,
                  ) => {
                    handleOptionKeyDown(
                      event,
                      index,
                    );
                  }}
                  className={cn(
                    "group flex min-h-[58px] w-full items-center gap-3",
                    "rounded-[17px] border px-3.5 py-3 text-left",
                    "transition-all duration-150",
                    "focus-visible:outline-none",
                    "focus-visible:ring-4 focus-visible:ring-indigo-100",
                    "disabled:cursor-not-allowed disabled:opacity-60",

                    active
                      ? [
                          "border-indigo-400",
                          "bg-indigo-50",
                          "shadow-[0_5px_18px_rgba(79,70,229,0.10)]",
                        ]
                      : [
                          "border-slate-200",
                          "bg-white",
                          "hover:border-indigo-200",
                          "hover:bg-indigo-50/40",
                        ],

                    "dark:border-slate-700",
                    "dark:bg-slate-950",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center",
                      "rounded-full border",
                      "text-xs font-black",
                      "transition",

                      active
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-400",
                    )}
                  >
                    {active ? (
                      <Check
                        className="size-4"
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                    ) : (
                      letter
                    )}
                  </span>

                  <span className="text-[15px] font-semibold leading-6 text-slate-800 dark:text-slate-100">
                    {label}
                  </span>
                </button>
              );
            },
          )}
        </div>
      ) : (
        <p
          role="alert"
          className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700"
        >
          Для цієї сцени не
          налаштовано варіанти
          відповіді.
        </p>
      )}
    </SceneShell>
  );
}
