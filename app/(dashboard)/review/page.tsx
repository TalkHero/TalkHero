import { ReviewSession } from "@/components/review/ReviewSession";

export default function ReviewPage() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Spaced repetition
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Daily review
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Review vocabulary at the right time to remember it
            longer.
          </p>
        </div>

        <ReviewSession />
      </div>
    </main>
  );
}
