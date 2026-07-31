"use client";

import {
  BookOpen,
  MessageCircle,
  MessagesSquare,
  Mic2,
} from "lucide-react";

type StatisticsCardsProps = {
  messagesSent: number;
  savedWords: number;
  speakingSessions: number;
  conversations: number;
};

const statistics = [
  {
    key: "messagesSent",
    label: "Надіслано повідомлень",
    icon: MessageCircle,
  },
  {
    key: "savedWords",
    label: "Збережено слів",
    icon: BookOpen,
  },
  {
    key: "conversations",
    label: "Діалогів",
    icon: MessagesSquare,
  },
  {
    key: "speakingSessions",
    label: "Розмовних сесій",
    icon: Mic2,
  },
] as const;

export function StatisticsCards({
  messagesSent,
  savedWords,
  speakingSessions,
  conversations,
}: StatisticsCardsProps) {
  const values = {
    messagesSent,
    savedWords,
    speakingSessions,
    conversations,
  };

  return (
    <section>
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-500">
          Ваша активність
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Статистика
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((statistic) => {
          const Icon = statistic.icon;

          return (
            <article
              key={statistic.key}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Icon className="h-5 w-5" />
              </div>

              <p className="mt-4 text-3xl font-bold text-slate-900">
                {values[statistic.key]}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {statistic.label}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
