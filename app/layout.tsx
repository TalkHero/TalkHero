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
  manifest: "/manifest.webmanifest",

  keywords: [
    "англійська мова",
    "вивчення англійської",
    "розмовна англійська",
    "інтерактивне навчання",
    "TalkHero",
  ],

  authors: [
    {
      name: "TalkHero",
    },
  ],

  creator: "TalkHero",
  publisher: "TalkHero",

  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/pwa/icon-192",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/pwa/icon-512",
        type: "image/png",
        sizes: "512x512",
      },
    ],

    apple: [
      {
        url: "/pwa/apple-icon",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    title: "TalkHero",
    statusBarStyle: "default",
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  robots: {
    index: true,
    follow: true,
  },

  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6366F1",
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
