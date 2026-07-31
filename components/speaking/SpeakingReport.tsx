"use client";

import Confetti from "react-confetti";
import { LevelUpModal } from "./LevelUpModal";
import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Gift,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";

export type SpeakingEvaluation = {
  grammarScore: number;
  fluencyScore: number;
  vocabularyScore: number;
  naturalnessScore: number;
  overallScore: number;
  wasCorrect: boolean;
  correctedSentence: string;
  shortFeedback: string;
  mainIssue: string;
  encouragement: string;
};

export type SpeakingReportMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type SpeakingCompletionData = {
  xpEarned: number;

  progress: {
  xp: number;
  level: number;
  progressPercent: number;

  previousLevel: number;
  leveledUp: boolean;
};
};

type SpeakingReportProps = {
  evaluations: SpeakingEvaluation[];
  messages: SpeakingReportMessage[];

  completionData?: SpeakingCompletionData | null;

  onClose: () => void;
  onRestart: () => void;
};

type ScoreField =
  | "grammarScore"
  | "fluencyScore"
  | "vocabularyScore"
  | "naturalnessScore"
  | "overallScore";

function calculateAverage(
  evaluations: SpeakingEvaluation[],
  field: ScoreField,
) {
  if (evaluations.length === 0) {
    return 0;
  }

  const total = evaluations.reduce(
    (sum, evaluation) => sum + evaluation[field],
    0,
  );

  return Math.round(total / evaluations.length);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

type ScoreRowProps = {
  label: string;
  score: number;
};

function ScoreRow({ label, score }: ScoreRowProps) {
  const safeScore = clampScore(score);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>

        <span className="text-sm font-bold text-slate-900">
          {safeScore}/100
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
          style={{
            width: `${safeScore}%`,
          }}
        />
      </div>
    </div>
  );
}

export function SpeakingReport({
  evaluations,
  messages,
  completionData,
  onClose,
  onRestart,
}: SpeakingReportProps) {
  const userMessages = messages.filter(
    (message) => message.role === "user" && message.content.trim(),
  );

  const grammarScore = calculateAverage(evaluations, "grammarScore");

  const fluencyScore = calculateAverage(evaluations, "fluencyScore");

  const vocabularyScore = calculateAverage(evaluations, "vocabularyScore");

  const naturalnessScore = calculateAverage(evaluations, "naturalnessScore");

  const overallScore = calculateAverage(evaluations, "overallScore");

  const correctAnswers = evaluations.filter(
    (evaluation) => evaluation.wasCorrect,
  ).length;

  const corrections = evaluations.filter(
    (evaluation) =>
      !evaluation.wasCorrect && evaluation.correctedSentence.trim(),
  );

  const mainIssues = Array.from(
    new Set(
      evaluations
        .map((evaluation) => evaluation.mainIssue.trim())
        .filter(Boolean),
    ),
  ).slice(0, 3);

  const encouragement =
    evaluations
      .map((evaluation) => evaluation.encouragement.trim())
      .filter(Boolean)
      .at(-1) || "Чудова робота! Продовжуйте практикувати розмовну англійську.";

  const progressPercent = clampScore(
  completionData?.progress.progressPercent ?? 0,
);

const currentLevel = completionData?.progress.level ?? 1;

const calculatedPreviousLevel = completionData
  ? Math.floor(
      Math.max(
        0,
        completionData.progress.xp - completionData.xpEarned,
      ) / 100,
    ) + 1
  : 1;

const previousLevel =
  completionData?.progress.previousLevel ?? calculatedPreviousLevel;

const didLevelUp =
  Boolean(completionData) &&
  (completionData?.progress.leveledUp === true ||
    currentLevel > previousLevel);

const [showConfetti, setShowConfetti] = useState(false);
const [showLevelUpModal, setShowLevelUpModal] = useState(false);


useEffect(() => {
  if (!completionData) {
    setShowConfetti(false);
    setShowLevelUpModal(false);
    return;
  }

  const currentLevel = completionData.progress.level;

  const calculatedPreviousLevel =
    Math.floor(
      Math.max(
        0,
        completionData.progress.xp - completionData.xpEarned,
      ) / 100,
    ) + 1;

  const previousLevel =
    completionData.progress.previousLevel ?? calculatedPreviousLevel;

  const leveledUp =
    completionData.progress.leveledUp === true ||
    currentLevel > previousLevel;

  setShowConfetti(true);
  setShowLevelUpModal(leveledUp);

  const timer = window.setTimeout(() => {
    setShowConfetti(false);
  }, 6000);

  return () => {
    window.clearTimeout(timer);
  };
}, [completionData]);

  return (
    <>
    <LevelUpModal
  isOpen={showLevelUpModal}
  previousLevel={previousLevel}
  newLevel={currentLevel}
  onClose={() => setShowLevelUpModal(false)}
/>
  {showConfetti && (
    <Confetti
      recycle={false}
      numberOfPieces={350}
    />
  )}

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-br from-indigo-600 to-violet-700 px-6 py-7 text-white sm:px-8">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-100">
            <Sparkles className="h-4 w-4" />
            Сесія заверщена
          </div>

          <h2 className="mt-2 text-2xl font-bold">Звіт про говоріння</h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">
            Перегляньте рівень вашої розмовної аннглійської мови та подивіться, що слід покращити під час наступної розмови.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close speaking report"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl bg-slate-950 p-6 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
            <Trophy className="h-6 w-6" />
          </div>

          <p className="mt-6 text-sm font-medium text-slate-400">
            Загагом балів
          </p>

          <div className="mt-2 flex items-end gap-1">
            <span className="text-5xl font-bold">{overallScore}</span>

            <span className="pb-1 text-lg text-slate-400">/100</span>
          </div>

          <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Ваші відповіді</span>

              <span className="font-bold">{userMessages.length}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Оцінені відповіді</span>

              <span className="font-bold">{evaluations.length}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Правильні відповіді</span>

              <span className="font-bold">{correctAnswers}</span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200">
            {encouragement}
          </div>
        </aside>

        <div className="space-y-6">
          {completionData && (
            <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
              <div className="flex items-center gap-3 border-b border-emerald-200/70 px-5 py-4 sm:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Gift className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">Нагороди за сесію</h3>

                  <p className="text-sm text-slate-500">
                    Ваш прогрес збережено
                  </p>
                </div>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Star className="h-4 w-4" />

                    <p className="text-xs font-semibold uppercase tracking-wider">
                      XP отримано
                    </p>
                  </div>

                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    +{completionData.xpEarned}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Trophy className="h-4 w-4" />

                    <p className="text-xs font-semibold uppercase tracking-wider">
                      Рівень
                    </p>
                  </div>

                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {completionData.progress.level}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-violet-600">
                    <TrendingUp className="h-4 w-4" />

                    <p className="text-xs font-semibold uppercase tracking-wider">
                      Усього XP
                    </p>
                  </div>

                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {completionData.progress.xp}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="rounded-2xl bg-white/80 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-600">
                      Рівень прогресу
                    </span>

                    <span className="text-sm font-bold text-slate-900">
                      {progressPercent}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Target className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">Оцінки навичок</h3>

                <p className="text-sm text-slate-500">
                  Середній результат за цю сесію
                </p>
              </div>
            </div>

            {evaluations.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                Дайте хоча б одну відповідь, щоб отримати детальні бали.
              </p>
            ) : (
              <div className="space-y-5">
                <ScoreRow label="Граматика" score={grammarScore} />

                <ScoreRow label="Плавність мовлення" score={fluencyScore} />

                <ScoreRow label="Словниковий запас" score={vocabularyScore} />

                <ScoreRow label="Природність вимови" score={naturalnessScore} />
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <MessageSquareText className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">Правки</h3>

                <p className="text-sm text-slate-500">
                  Кращі способи висловлення своїх ідей
                </p>
              </div>
            </div>

            {corrections.length === 0 ? (
              <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                <p className="text-sm leading-6 text-emerald-700">
                  Під час цього сеансу виправлення речень не було потрібно.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {corrections.slice(0, 5).map((evaluation, index) => (
                  <div
                    key={`${evaluation.correctedSentence}-${index}`}
                    className="rounded-2xl bg-slate-50 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Краще речення
                    </p>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
                      {evaluation.correctedSentence}
                    </p>

                    {evaluation.shortFeedback && (
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {evaluation.shortFeedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {mainIssues.length > 0 && (
            <section className="rounded-3xl border border-slate-200 p-5 sm:p-6">
              <h3 className="font-bold text-slate-900">Focus for next time</h3>

              <div className="mt-4 flex flex-wrap gap-2">
                {mainIssues.map((issue) => (
                  <span
                    key={issue}
                    className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Повернутись до розмови
        </button>

        <button
          type="button"
          onClick={onRestart}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <RefreshCw className="h-4 w-4" />
          Почасти нову сесію
        </button>
      </div>
    </section>
  </>
);
}
