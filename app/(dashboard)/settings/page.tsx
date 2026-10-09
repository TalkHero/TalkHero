import type { ReactNode } from "react";
import {
  Bell,
  Globe2,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Volume2,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Settings2 className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Налаштування
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Налаштуйте TalkHero під себе.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <SettingCard
          icon={<Globe2 className="h-5 w-5" />}
          title="Мова інтерфейсу"
          description="Мова системних повідомлень та елементів TalkHero."
        >
          <div className="rounded-xl border bg-muted/30 px-4 py-2 text-sm font-medium">
            Українська
          </div>
        </SettingCard>

        <SettingCard
          icon={<Volume2 className="h-5 w-5" />}
          title="Голос і звук"
          description="Налаштування озвучення, голосових вправ та аудіо."
        >
          <div className="rounded-xl border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
            Незабаром
          </div>
        </SettingCard>

        <SettingCard
          icon={<Bell className="h-5 w-5" />}
          title="Сповіщення"
          description="Нагадування про навчання, повторення та прогрес."
        >
          <div className="rounded-xl border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
            Незабаром
          </div>
        </SettingCard>

        <SettingCard
          icon={<SlidersHorizontal className="h-5 w-5" />}
          title="Навчання"
          description="Параметри персоналізації навчального процесу."
        >
          <div className="rounded-xl border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
            Незабаром
          </div>
        </SettingCard>

        <SettingCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Безпека та конфіденційність"
          description="Керування параметрами облікового запису та приватності."
        >
          <div className="rounded-xl border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
            Незабаром
          </div>
        </SettingCard>
      </div>
    </main>
  );
}

function SettingCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          {icon}
        </div>

        <div>
          <h2 className="font-semibold">{title}</h2>

          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="shrink-0 sm:ml-6">{children}</div>
    </section>
  );
}
