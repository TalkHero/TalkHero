import { SpeakingSession } from "@/components/speaking/SpeakingSession";

export default function SpeakingPage() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
      <div className="hidden shrink-0 lg:mb-6 lg:block">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Голосова практика
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Розмовна практика
        </h1>

        <p className="mt-2 max-w-2xl text-slate-500">
          Спілкуйтеся з Еммою англійською мовою. Говоріть природно, слухайте її відповідь та продовжуйте діалог, не використовуючи клавіатуру.
        </p>
      </div>

      <div className="min-h-0 flex-1">
        <SpeakingSession />
      </div>
    </div>
  );
}
