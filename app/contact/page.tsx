import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bot, Bug, Lightbulb, MessageCircle } from "lucide-react";
import { FeedbackForm } from "@/components/contact/FeedbackForm";

export const metadata: Metadata = {
  title: "Підтримка та зворотний зв’язок",
  description:
    "Надішліть команді TalkHero повідомлення про помилку, ідею або запитання.",
  alternates: {
    canonical: "/contact",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <Bot className="h-5 w-5" />
            </div>

            <span className="text-xl font-black text-slate-950">
              Talk<span className="text-indigo-600">Hero</span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4" />
            На головну
          </Link>
        </div>
      </header>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-600">
              <MessageCircle className="h-8 w-8" />
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Підтримка та зворотний зв’язок
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Знайшли помилку, маєте ідею або хочете щось запропонувати?
              Надішліть повідомлення команді TalkHero.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <Bug className="h-6 w-6 text-indigo-600" />
              <h2 className="mt-4 font-bold text-slate-950">
                Повідомити про помилку
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Опишіть, що сталося, і за можливості додайте скріншот.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <Lightbulb className="h-6 w-6 text-indigo-600" />
              <h2 className="mt-4 font-bold text-slate-950">
                Запропонувати ідею
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Розкажіть, що зробило б навчання в TalkHero кращим.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <MessageCircle className="h-6 w-6 text-indigo-600" />
              <h2 className="mt-4 font-bold text-slate-950">
                Поставити запитання
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Напишіть нам щодо роботи сервісу або вашого акаунта.
              </p>
            </div>
          </div>

          <FeedbackForm />
        </div>
      </section>
    </main>
  );
}
