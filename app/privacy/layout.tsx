import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Політика конфіденційності",
  description:
    "Політика конфіденційності TalkHero: які дані ми збираємо, як використовуємо та захищаємо інформацію користувачів.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Політика конфіденційності | TalkHero",
    description:
      "Інформація про збір, використання та захист даних користувачів TalkHero.",
    url: "/privacy",
    type: "website",
  },
};

export default function PrivacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
