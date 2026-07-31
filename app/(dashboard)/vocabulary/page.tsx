import { VocabularyManager } from "@/components/vocabulary/VocabularyManager";

export default function VocabularyPage() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Інструменти навчання
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Словник
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Зберігайте корисні слова, повторюйте їхні значення
та стежте за своїм прогресом.
          </p>
        </div>

        <VocabularyManager />
      </div>
    </main>
  );
}
