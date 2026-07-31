"use client";

import { CalendarDays, Flame } from "lucide-react";

export type ActivityCalendarDay = {
  date: string;
  count: number;
};

type ActivityCalendarProps = {
  days: ActivityCalendarDay[];
  totalActiveDays: number;
  currentStreak: number;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getActivityClass(count: number) {
  if (count <= 0) {
    return "border-slate-200 bg-slate-100";
  }

  if (count === 1) {
    return "border-emerald-200 bg-emerald-200";
  }

  if (count <= 3) {
    return "border-emerald-300 bg-emerald-300";
  }

  if (count <= 6) {
    return "border-emerald-400 bg-emerald-400";
  }

  return "border-emerald-600 bg-emerald-600";
}

function getActivityLabel(count: number) {
  if (count === 0) {
    return "Без активності";
  }

  if (count === 1) {
    return "1 активність";
  }

  if (count >= 2 && count <= 4) {
    return `${count} активності`;
  }

  return `${count} активностей`;
}

function getDayLabel(days: number) {
  const lastDigit = days % 10;
  const lastTwo = days % 100;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return "днів";
  }

  if (lastDigit === 1) {
    return "день";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "дні";
  }

  return "днів";
}

export function ActivityCalendar({
  days,
  totalActiveDays,
  currentStreak,
}: ActivityCalendarProps) {
  const normalizedDays = days.slice(-91);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Календар активності
              </h2>

              <p className="text-sm text-slate-500">
                Ваша навчальна активність за останні 13 тижнів
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Активні дні
            </p>

            <p className="mt-0.5 text-lg font-bold text-slate-900">
              {totalActiveDays}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2">
            <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-orange-600">
              <Flame className="h-3.5 w-3.5 fill-orange-500" />
              Поточна серія
            </p>

            <p className="mt-0.5 text-lg font-bold text-orange-700">
              {currentStreak} {getDayLabel(currentStreak)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="min-w-[720px]">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5">
            {normalizedDays.map((day) => (
              <div
                key={day.date}
                className={`h-4 w-4 rounded-[4px] border transition hover:scale-125 ${getActivityClass(
                  day.count,
                )}`}
                title={`${formatDate(day.date)} · ${getActivityLabel(
                  day.count,
                )}`}
                aria-label={`${formatDate(day.date)}: ${getActivityLabel(
                  day.count,
                )}`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-400">
            <span>Менше</span>

            <span className="h-3.5 w-3.5 rounded-[3px] border border-slate-200 bg-slate-100" />
            <span className="h-3.5 w-3.5 rounded-[3px] border border-emerald-200 bg-emerald-200" />
            <span className="h-3.5 w-3.5 rounded-[3px] border border-emerald-300 bg-emerald-300" />
            <span className="h-3.5 w-3.5 rounded-[3px] border border-emerald-400 bg-emerald-400" />
            <span className="h-3.5 w-3.5 rounded-[3px] border border-emerald-600 bg-emerald-600" />

            <span>Більше</span>
          </div>
        </div>
      </div>

      {normalizedDays.every((day) => day.count === 0) && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Активність поки що відсутня
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Почніть чат або пройдіть speaking-сесію, щоб заповнити календар активності.
          </p>
        </div>
      )}
    </section>
  );
}
