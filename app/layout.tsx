import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TalkHero — вивчайте англійську через живі ситуації",
    template: "%s | TalkHero",
  },
  description:
    "Вивчайте англійську через інтерактивні місії, живі розмови, словник, повторення та розмовну практику.",
  applicationName: "TalkHero",
  keywords: [
    "англійська мова",
    "вивчення англійської",
    "розмовна англійська",
    "інтерактивне навчання",
    "TalkHero",
  ],
  authors: [{ name: "TalkHero" }],
  creator: "TalkHero",
  publisher: "TalkHero",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F8FAFC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          "flex min-h-screen flex-col",
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
