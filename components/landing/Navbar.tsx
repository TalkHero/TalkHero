"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navigation = [
  { label: "Можливості", href: "#features" },
  { label: "Як це працює", href: "#how-it-works" },
  { label: "Огляд", href: "#preview" },
  { label: "Переваги", href: "#comparison" },
  { label: "Поширені питання", href: "#faq" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = navigation
        .map((item) => document.querySelector(item.href))
        .filter((section): section is Element => section !== null);

      let currentSection = "";

      for (const section of sections) {
        const rect = section.getBoundingClientRect();

        if (rect.top <= 160) {
          currentSection = section.id;
        }
      }

      setActiveSection(currentSection);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-white/70 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={closeMenu}
          className="group inline-flex items-center gap-3"
          aria-label="Головна сторінка TalkHero"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-black text-white shadow-lg shadow-indigo-600/20 transition group-hover:-translate-y-0.5">
            T
          </div>

          <span className="text-xl font-black tracking-tight text-slate-950">
            Talk<span className="text-indigo-600">Hero</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => {
            const sectionId = item.href.replace("#", "");
            const isActive = activeSection === sectionId;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Увійти
          </Link>

          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"
          >
            Почати навчання
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-50 lg:hidden"
          aria-label={
            isOpen
              ? "Закрити меню навігації"
              : "Відкрити меню навігації"
          }
          aria-expanded={isOpen}
        >
          <span className="relative block h-5 w-5">
            <span
              className={`absolute left-0 top-1 block h-0.5 w-5 rounded-full bg-current transition ${
                isOpen ? "translate-y-1.5 rotate-45" : ""
              }`}
            />

            <span
              className={`absolute left-0 top-2.5 block h-0.5 w-5 rounded-full bg-current transition ${
                isOpen ? "opacity-0" : ""
              }`}
            />

            <span
              className={`absolute left-0 top-4 block h-0.5 w-5 rounded-full bg-current transition ${
                isOpen ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      <div
        className={`overflow-hidden border-slate-200 bg-white transition-all duration-300 lg:hidden ${
          isOpen
            ? "max-h-[520px] border-t opacity-100"
            : "max-h-0 border-t-0 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-7xl space-y-2 px-4 py-5 sm:px-6">
          {navigation.map((item) => {
            const sectionId = item.href.replace("#", "");
            const isActive = activeSection === sectionId;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`block rounded-2xl px-4 py-3 text-base font-bold transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-5">
            <Link
              href="/login"
              onClick={closeMenu}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Увійти
            </Link>

            <Link
              href="/register"
              onClick={closeMenu}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Почати навчання
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
