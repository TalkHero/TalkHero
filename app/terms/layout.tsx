import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Умови використання",
  description:
    "Умови використання TalkHero — правила користування сервісом для вивчення англійської мови.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Умови використання | TalkHero",
    description: "Правила та умови використання сервісу TalkHero.",
    url: "/terms",
    type: "website",
  },
};

export default function TermsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
