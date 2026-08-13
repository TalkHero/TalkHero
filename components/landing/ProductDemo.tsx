import { ArrowRight, Brain, MessageCircle, Sparkles } from "lucide-react";

export function ProductDemo() {
  return (
    <section className="bg-white px-6 pb-20 pt-28 sm:pb-24 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
            <Sparkles className="h-4 w-4" />
            Персональне навчання з Emma
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Emma не просто розмовляє з вами.
            <span className="block text-indigo-600">
              Вона навчається разом із вами.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Практикуйте реальні розмови англійською, отримуйте зрозумілий
            зворотний зв&apos;язок і продовжуйте наступне заняття з того місця,
            де зупинилися.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <Brain className="h-6 w-6" />
              </div>

              <h3 className="mt-6 text-2xl font-bold text-slate-950">
                Розмови стають персональнішими
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Emma пам&apos;ятає важливий контекст із ваших розмов і може
                використовувати його пізніше, щоб практика була природнішою та
                ближчою саме до вас.
              </p>

              <div className="mt-7 flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <MessageCircle className="h-4 w-4" />
                Говоріть природно — як із реальним співрозмовником
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 sm:p-7">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                    E
                  </div>

                  <div>
                    <p className="font-semibold text-slate-950">Emma</p>
                    <p className="text-sm text-emerald-600">Ваш ШІ-викладач</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 text-sm leading-6 text-white">
                    Do you remember what I do for work?
                  </div>

                  <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">
                    Yes, you&apos;re a programmer. What do you like most about
                    programming?
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Персональний контекст
                    </p>

                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      Emma використала інформацію з попередньої розмови, щоб
                      природно продовжити практику.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Почати перше заняття
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
