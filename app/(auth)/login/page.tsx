import { Brain, CheckCircle2, MessageCircleMore, Sparkles } from "lucide-react";

import { LoginForm } from "@/components/auth/LoginForm";

const benefits = [
  {
    icon: MessageCircleMore,
    title: "Продовжуйте практику з Emma",
    text: "Повертайтеся до голосових діалогів і тренуйте англійську у своєму темпі.",
  },
  {
    icon: Brain,
    title: "Ваш контекст зберігається",
    text: "Emma пам’ятає важливі деталі з попередніх занять і продовжує з того місця, де ви зупинилися.",
  },
  {
    icon: CheckCircle2,
    title: "Прогрес нікуди не зникає",
    text: "Ваші XP, серія занять, словник і результати залишаються у профілі.",
  },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4" />
              TalkHero
            </div>

            <h1 className="mt-8 max-w-xl text-5xl font-black leading-tight">
              Продовжуйте впевнено говорити англійською
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-8 text-indigo-100">
              Увійдіть у свій акаунт і поверніться до персональної практики,
              словника та прогресу.
            </p>

            <div className="mt-10 space-y-5">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div
                    key={benefit.title}
                    className="flex max-w-xl items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-bold">{benefit.title}</h2>

                      <p className="mt-1 text-sm leading-6 text-indigo-100">
                        {benefit.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="relative mt-10 text-sm text-indigo-200">
            Усі ваші заняття, слова та прогрес — в одному акаунті
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-lg">
            <div className="mb-8 lg:hidden">
              <div className="text-2xl font-black text-slate-950">
                Talk<span className="text-indigo-600">Hero</span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Speak. Learn. Become.
              </p>
            </div>

            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
