import Link from "next/link";
import { Bot, Globe, Mail } from "lucide-react";

const productLinks = [
  { label: "Можливості", href: "#features" },
  { label: "Як це працює", href: "#how-it-works" },
  { label: "Платформа", href: "#platform" },
  { label: "Поширені запитання", href: "#faq" },
];

const legalLinks = [
  { label: "Політика конфіденційності", href: "/privacy" },
  { label: "Умови використання", href: "/terms" },
  { label: "Контакти", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <Bot className="h-6 w-6" />
              </div>

              <span className="text-xl font-black">
                Talk<span className="text-indigo-400">Hero</span>
              </span>
            </Link>

            <p className="mt-5 leading-7 text-slate-400">
              Персональний ШІ-викладач англійської, який допомагає
              практикувати живі діалоги, покращувати вимову, розширювати
              словниковий запас і впевнено рухатися до своєї мети.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/contact"
                aria-label="Контакти"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 transition hover:bg-indigo-600 hover:text-white"
              >
                <Mail className="h-5 w-5" />
              </Link>

              <Link
                href="/"
                aria-label="Головна сторінка"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 transition hover:bg-indigo-600 hover:text-white"
              >
                <Globe className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white">
              TalkHero
            </h3>

            <nav className="mt-5 flex flex-col gap-3">
              {productLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="w-fit text-sm text-slate-400 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="font-bold text-white">
              Інформація
            </h3>

            <nav className="mt-5 flex flex-col gap-3">
              {legalLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="w-fit text-sm text-slate-400 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 TalkHero. Усі права захищені.</p>

          <p>Вивчайте. Практикуйте. Досягайте більшого.</p>
        </div>
      </div>
    </footer>
  );
}
