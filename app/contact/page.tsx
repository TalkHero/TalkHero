import Link from "next/link";
import { ArrowLeft, Bot, Mail, MessageCircle } from "lucide-react";

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
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4" />
            На головну
          </Link>
        </div>
      </header>

      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-10 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-600">
            <MessageCircle className="h-8 w-8" />
          </div>

          <h1 className="mt-8 text-5xl font-black text-slate-900">
            Contact
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Ми убдем раді отрмати від  вас відгук, повіомлення про помилку, пораду про покращення, або пропозицію партнерства
          </p>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <Mail className="h-6 w-6" />
              </div>

              <div>
                <p className="font-semibold text-slate-500">
                  Електронна пошта
                </p>

                <a
                  href="mailto:hello@talkhero.app"
                  className="text-lg font-bold text-indigo-600 hover:underline"
                >
                  hello@talkhero.app
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl bg-indigo-600 p-8 text-white">
            <h2 className="text-2xl font-black">
              We usually reply within 24 hours
            </h2>

            <p className="mt-4 leading-7 text-indigo-100">
              Whether you found a bug, have an idea for a new feature or simply
              want to say hello — we'd love to hear from you.
            </p>
          </div>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white transition hover:bg-black"
            >
              Return to homepage
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
