"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const questions = [
  {
    question: "Чи підійде TalkHero, якщо я тільки починаю вивчати англійську?",
    answer:
      "Так. TalkHero адаптується до вашого рівня знань — від A1 до C2. ШІ підбирає складність діалогів, пояснень і вправ відповідно до ваших навичок.",
  },
  {
    question: "Як працює ШІ-викладач?",
    answer:
      "ШІ-викладач веде природні діалоги англійською, допомагає виправляти помилки, пояснює незрозумілі моменти та підтримує навчання у вашому темпі.",
  },
  {
    question: "Чи можу я практикувати говоріння?",
    answer:
      "Так. Ви можете спілкуватися голосом, покращувати вимову, розвивати впевненість у спілкуванні та отримувати миттєвий зворотний зв’язок після кожної розмови.",
  },
  {
    question: "Як TalkHero допомагає запам'ятовувати нові слова?",
    answer:
      "Нові слова та вирази автоматично додаються до словника. Потім ви можете повторювати їх за допомогою системи інтервальних повторень, щоб краще закріпити матеріал.",
  },
  {
    question: "Чи можна навчатися зі смартфона?",
    answer:
      "Так. TalkHero працює на смартфонах, планшетах і комп'ютерах. Ви можете навчатися будь-де та будь-коли.",
  },
  {
    question: "Чи можна почати безкоштовно?",
    answer:
      "Так. Ви можете створити акаунт і почати вивчати англійську безкоштовно. У майбутньому будуть доступні додаткові можливості в платних тарифах.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
            <HelpCircle className="h-4 w-4" />
            Поширені запитання
          </div>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Відповіді на найпоширеніші запитання
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Зібрали відповіді на питання, які найчастіше виникають перед початком навчання.
          </p>
        </div>

        <div className="mt-14 space-y-4">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left sm:px-8"
                  aria-expanded={isOpen}
                >
                  <span className="text-lg font-bold text-slate-900">
                    {item.question}
                  </span>

                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                      isOpen
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-300 ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 leading-7 text-slate-600 sm:px-8 sm:pb-8">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
