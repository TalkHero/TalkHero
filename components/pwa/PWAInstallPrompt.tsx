"use client";

import { useEffect, useRef, useState } from "react";
import { Download, PlusSquare, Share2, Smartphone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DISMISSED_STORAGE_KEY = "talkhero-pwa-install-dismissed-at";

const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

type InstallMode = "native" | "ios" | null;

function isRunningStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent;

  const classicIos = /iPad|iPhone|iPod/i.test(userAgent);

  const ipadDesktopMode =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return classicIos || ipadDesktopMode;
}

function wasDismissedRecently(): boolean {
  try {
    const storedValue = window.localStorage.getItem(DISMISSED_STORAGE_KEY);

    if (!storedValue) {
      return false;
    }

    const dismissedAt = Number(storedValue);

    if (!Number.isFinite(dismissedAt)) {
      return false;
    }

    return Date.now() - dismissedAt < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

function rememberDismissal(): void {
  try {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, Date.now().toString());
  } catch {
    // Банер просто з’явиться знову в наступній сесії.
  }
}

export function PWAInstallPrompt() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const [mode, setMode] = useState<InstallMode>(null);

  const [installing, setInstalling] = useState(false);

  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    if (isRunningStandalone() || wasDismissedRecently()) {
      return;
    }

    const detectIosTimer = window.setTimeout(() => {
      if (isIosDevice()) {
        setMode("ios");
      }
    }, 600);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();

      deferredPromptRef.current = event as BeforeInstallPromptEvent;

      setMode("native");
    }

    function handleAppInstalled() {
      deferredPromptRef.current = null;
      setMode(null);
      setShowIosInstructions(false);

      try {
        window.localStorage.removeItem(DISMISSED_STORAGE_KEY);
      } catch {
        // Застосунок уже встановлено.
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.clearTimeout(detectIosTimer);

      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );

      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function handleDismiss() {
    rememberDismissal();
    deferredPromptRef.current = null;
    setMode(null);
    setShowIosInstructions(false);
  }

  async function handleNativeInstall() {
    const promptEvent = deferredPromptRef.current;

    if (!promptEvent || installing) {
      return;
    }

    try {
      setInstalling(true);

      await promptEvent.prompt();

      const choice = await promptEvent.userChoice;

      deferredPromptRef.current = null;

      if (choice.outcome === "accepted") {
        setMode(null);
      }
    } catch (error) {
      console.error("Не вдалося відкрити встановлення TalkHero:", error);
    } finally {
      setInstalling(false);
    }
  }

  if (!mode) {
    return null;
  }

  return (
    <div
      className={[
        "fixed inset-x-3 z-[70]",
        "bottom-[calc(5rem+env(safe-area-inset-bottom))]",
        "sm:left-auto sm:right-5 sm:w-[390px]",
        "lg:bottom-5",
      ].join(" ")}
    >
      <Card
        role="region"
        aria-label="Встановлення TalkHero"
        className="overflow-hidden border-primary/20 shadow-xl"
      >
        <CardContent className="p-0">
          <div className="relative bg-gradient-to-r from-primary to-blue-600 px-5 py-4 text-primary-foreground">
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Закрити пропозицію встановлення"
              className={[
                "absolute right-2 top-2",
                "flex size-9 items-center justify-center",
                "rounded-md text-white/80",
                "transition hover:bg-white/15 hover:text-white",
                "focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-white/70",
              ].join(" ")}
            >
              <X className="size-4" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-3 pr-8">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Smartphone className="size-6" aria-hidden="true" />
              </div>

              <div>
                <h2 className="font-bold">Встановіть TalkHero</h2>

                <p className="mt-0.5 text-sm text-white/80">
                  Навчайтеся у форматі мобільного застосунку.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {mode === "native" ? (
              <>
                <p className="text-sm leading-6 text-muted-foreground">
                  Відкривайте TalkHero з головного екрана — без вкладок браузера
                  та з підтримкою офлайн-екрана.
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => {
                      void handleNativeInstall();
                    }}
                    disabled={installing}
                    width="full"
                  >
                    <Download aria-hidden="true" />
                    {installing ? "Відкриваємо…" : "Встановити"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleDismiss}
                    width="full"
                  >
                    Не зараз
                  </Button>
                </div>
              </>
            ) : (
              <>
                {!showIosInstructions ? (
                  <>
                    <p className="text-sm leading-6 text-muted-foreground">
                      На iPhone та iPad TalkHero встановлюється через меню
                      Safari.
                    </p>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        onClick={() => {
                          setShowIosInstructions(true);
                        }}
                        width="full"
                      >
                        <Share2 aria-hidden="true" />
                        Як встановити
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleDismiss}
                        width="full"
                      >
                        Не зараз
                      </Button>
                    </div>
                  </>
                ) : (
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Встановлення на iPhone або iPad
                    </h3>

                    <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
                          1
                        </span>

                        <span className="pt-1">
                          Відкрийте TalkHero у браузері Safari.
                        </span>
                      </li>

                      <li className="flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
                          2
                        </span>

                        <span className="flex items-center gap-2 pt-1">
                          Натисніть
                          <Share2
                            className="size-4 text-primary"
                            aria-hidden="true"
                          />
                          «Поділитися».
                        </span>
                      </li>

                      <li className="flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">
                          3
                        </span>

                        <span className="flex items-center gap-2 pt-1">
                          Оберіть
                          <PlusSquare
                            className="size-4 text-primary"
                            aria-hidden="true"
                          />
                          «Додати на початковий екран».
                        </span>
                      </li>
                    </ol>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowIosInstructions(false);
                      }}
                      width="full"
                      className="mt-5"
                    >
                      Назад
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
