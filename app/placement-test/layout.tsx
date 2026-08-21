import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тест на рівень англійської",
  description:
    "Пройдіть тест TalkHero та визначте свій рівень англійської мови за шкалою CEFR.",
  alternates: {
    canonical: "/placement-test",
  },
  openGraph: {
    title: "Тест на рівень англійської | TalkHero",
    description:
      "Визначте свій рівень англійської мови за допомогою адаптивного тесту TalkHero.",
    url: "/placement-test",
    type: "website",
  },
};

export default function PlacementTestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
