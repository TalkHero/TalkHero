import type { QuestProgress } from "@/lib/quests";

type ProgressBarProps = {
  progress: QuestProgress;
};

export function ProgressBar({ progress }: ProgressBarProps) {
  const percentage = progress.total > 0
    ? Math.min(100, Math.max(0, (progress.completed / progress.total) * 100))
    : 0;

  return (
    <div aria-label={`Quest progress: ${progress.completed} of ${progress.total}`}>
      <div className="mb-2 flex justify-between text-sm text-slate-600">
        <span>Progress</span>
        <span>{progress.current} / {progress.total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
