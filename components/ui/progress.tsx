"use client";

import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
  indicatorClassName?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  className,
  indicatorClassName,
  size = "md",
}: ProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const safeValue = clamp(value, 0, safeMax);
  const percentage = Math.round((safeValue / safeMax) * 100);

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-4">
          {label ? (
            <span className="text-sm font-medium text-foreground">{label}</span>
          ) : (
            <span />
          )}

          {showValue ? (
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">
              {percentage}%
            </span>
          ) : null}
        </div>
      )}

      <div
        data-slot="progress"
        role="progressbar"
        aria-label={label ?? "Прогрес"}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={`${percentage}%`}
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted",
          sizeClasses[size],
        )}
      >
        <div
          data-slot="progress-indicator"
          className={cn(
            "h-full rounded-full bg-primary",
            "transition-[width] duration-500 ease-out",
            indicatorClassName,
          )}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

export { Progress };
export type { ProgressProps };
