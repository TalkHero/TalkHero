import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Mail,
  Settings,
  ShieldCheck,
  Trash2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Видалення облікового запису | TalkHero",
  description:
    "Інструкції щодо видалення облікового запису TalkHero та пов’язаних із ним даних.",
  alternates: {
    canonical: "/delete-account",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DeleteAccountPage() {
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

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:p-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <Trash2 className="h-7 w-7" />
            </div>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
              Керування даними
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Видалення облікового запису TalkHero
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Ви можете назавжди видалити свій обліковий запис TalkHero
              разом із пов’язаними з ним персональними та навчальними даними.
            </p>

            <div className="mt-10 space-y-6">
              <section className="rounded-3xl border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                    <Settings className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Видалення після входу в TalkHero
                    </h2>

                    <p className="mt-3 leading-7 text-slate-600">
                      Увійдіть у свій обліковий запис, відкрийте
                      «Налаштування» → «Безпека та конфіденційність» і
                      натисніть «Видалити акаунт».
                    </p>

                    <Link
                      href="/settings"
                      className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700"
                    >
                      Відкрити налаштування
                    </Link>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                    <Mail className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Якщо ви не можете увійти
                    </h2>

                    <p className="mt-3 leading-7 text-slate-600">
                      Надішліть запит через сторінку підтримки TalkHero.
                      Вкажіть електронну адресу, яка використовується у вашому
                      обліковому записі, і напишіть у повідомленні
                      «Прошу видалити мій обліковий запис TalkHero».
                    </p>

                    <p className="mt-3 leading-7 text-slate-600">
                      Перед виконанням запиту ми можемо попросити підтвердити,
                      що обліковий запис належить саме вам.
                    </p>

                    <Link
                      href="/contact"
                      className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700"
                    >
                      Подати запит на видалення
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            <section className="mt-10">
              <h2 className="text-2xl font-black text-slate-950">
                Які дані видаляються
              </h2>

              <p className="mt-4 leading-8 text-slate-600">
                Під час видалення облікового запису видаляються дані профілю,
                навчальний прогрес, XP і досягнення, словник, історія розмов,
                розмовні сесії, результати тестів і квестів, персоналізовані
                навчальні дані, звернення до підтримки, пов’язані з акаунтом,
                а також завантажені до таких звернень файли.
              </p>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl font-black text-slate-950">
                Дані, які можуть тимчасово зберігатися
              </h2>

              <p className="mt-4 leading-8 text-slate-600">
                Технічні резервні копії можуть зберігатися протягом
                обмеженого часу до їх планового перезапису. Окремі дані
                також можуть зберігатися довше, якщо цього вимагає
                законодавство, безпека сервісу, запобігання шахрайству або
                вирішення спорів. Такі дані не використовуються для
                продовження роботи видаленого облікового запису.
              </p>
            </section>

            <div className="mt-10 rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
              <div className="flex gap-4">
                <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-indigo-600" />

                <div>
                  <p className="font-bold text-indigo-950">
                    Видалення є незворотним
                  </p>

                  <p className="mt-2 leading-7 text-indigo-900">
                    Після завершення видалення відновити обліковий запис,
                    навчальний прогрес та інші пов’язані дані буде неможливо.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row">
              <Link
                href="/privacy"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Політика конфіденційності
              </Link>

              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Підтримка
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}