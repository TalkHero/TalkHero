"use client";

import { CheckCircle2, Lightbulb, MessageCircle, Sparkles } from "lucide-react";
import { normalizeFeedback } from "@/lib/learning/feedback";
import type { LearningFeedback } from "@/lib/quests/types";

type Props = {
  feedback: string | LearningFeedback;
  isCorrect: boolean | null;
  grade:
    | "correct"
    | "almost"
    | "incorrect"
    | null;
};

export function AIFeedbackCard({
  feedback,
  isCorrect,
  grade,
}: Props) {
  const coach = normalizeFeedback(feedback, isCorrect);
  if (!coach) return null;
  const variant =
  grade === "correct"
    ? "correct"
    : grade === "almost"
    ? "almost"
    : "incorrect";

  return (
    <section aria-live="polite" aria-label="Навчальний відгук" className={["overflow-hidden rounded-3xl border bg-white shadow-sm", variant === "correct"
  ? "border-emerald-200"
  : variant === "almost"
  ? "border-amber-200"
  : "border-red-200"].join(" ")}>
      <header className={["flex items-center gap-3 border-b px-5 py-4 sm:px-6", variant === "correct"
  ? "border-emerald-100 bg-emerald-50"
  : variant === "almost"
  ? "border-amber-100 bg-amber-50"
  : "border-red-100 bg-red-50"].join(" ")}>
        <div className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", variant === "correct"
  ? "bg-emerald-100 text-emerald-700"
  : variant === "almost"
  ? "bg-amber-100 text-amber-700"
  : "bg-red-100 text-red-700"].join(" ")}>
          {
  variant === "correct"
    ? <CheckCircle2 className="h-5 w-5" />
    : <Sparkles className="h-5 w-5" />
}
        </div>
        <div>
          <p
  className={[
    "font-bold",
    variant === "correct"
      ? "text-emerald-900"
      : variant === "almost"
      ? "text-amber-900"
      : "text-red-900",
  ].join(" ")}
>{
  variant === "correct"
    ? "Чудово!"
    : variant === "almost"
    ? "Майже!"
    : "Спробуйте ще раз"
}</p>
          <p className="text-sm text-slate-600">{
  variant === "correct"
    ? "Саме так говорять носії мови."
    : variant === "almost"
    ? "Хороша спроба. Розберімо короткий нюанс."
    : "Давайте покращимо відповідь."
}</p>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        {variant !== "correct" && coach.naturalAnswer && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-800"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Як сказати природно</div>
            <p className="mt-2 text-lg font-semibold leading-7 text-slate-950">“{coach.naturalAnswer}”</p>
          </div>
        )}

        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-violet-800"><MessageCircle className="h-4 w-4" aria-hidden="true" />{
  variant === "correct"
    ? "Чому це добре"
    : "Чому саме так"
}</div>
          <p className="mt-2 whitespace-pre-line leading-7 text-slate-700">{coach.explanation}</p>
        </div>

        {coach.remember && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-800"><Lightbulb className="h-4 w-4" aria-hidden="true" />{variant === "correct"
  ? "Корисно знати"
  : "Запам’ятайте"}</div>
            <p className="mt-2 leading-7 text-slate-700">{coach.remember}</p>
          </div>
        )}

        {coach.npcReply && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800"><MessageCircle className="h-4 w-4" aria-hidden="true" />Відповідь персонажа</div>
            <p className="mt-2 text-lg font-medium leading-7 text-slate-950">“{coach.npcReply}”</p>
          </div>
        )}
      </div>
    </section>
  );
}
