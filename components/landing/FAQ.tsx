"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const questions = [
  {
    question: "Чи підійде TalkHero, якщо я тільки починаю вивчати англійську?",
    answer:
      "Так. TalkHero адаптується до вашого рівня та поступово ускладнює практику. Якщо поки складно відповідати англійською, Emma може пояснювати українською та допомагати сформулювати відповідь.",
  },
  {
    question:
      "Чи можна реально практикувати говоріння, а не лише писати в чаті?",
    answer:
      "Так. У TalkHero є голосова практика: ви говорите англійською вголос, отримуєте зворотний зв’язок і можете тренувати вимову, швидкість мовлення та впевненість у діалогах.",
  },
  {
    question: "Чи пам’ятає Emma попередні розмови?",
    answer:
      "Так. TalkHero може зберігати важливий контекст із ваших попередніх занять — наприклад, професію, навчальні цілі або теми, які вам цікаві. Це допомагає робити наступні розмови більш персональними.",
  },
  {
    question: "Чи можна почати безкоштовно?",
    answer:
      "Так. Ви можете створити акаунт і почати користуватися TalkHero безкоштовно. Банківська картка для старту не потрібна.",
  },
  {
    question: "Чи можна зареєструватися або увійти через Google?",
    answer:
      "Так. Ви можете продовжити через Google або скористатися звичайною реєстрацією за електронною поштою та паролем.",
  },
  {
    question: "Чи працює TalkHero на смартфоні?",
    answer:
      "Так. TalkHero адаптований для смартфонів, планшетів і комп’ютерів, тому ви можете практикувати англійську там, де вам зручно.",
  },
  {
    question: "Що відбувається з моїм прогресом після виходу з акаунта?",
    answer:
      "Ваш прогрес зберігається у профілі: рівень, XP, серія занять, словник, результати та інші навчальні дані залишаються доступними після наступного входу.",
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
            Маєте запитання перед стартом?
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Коротко про рівень, голосову практику, Google-вхід, прогрес і
            безкоштовний старт.
          </p>
        </div>

        <div className="mt-14 space-y-4">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200"
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
