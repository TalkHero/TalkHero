import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex w-fit items-center justify-center gap-1.5",
    "rounded-full border px-2.5 py-1",
    "text-xs font-semibold leading-none",
    "transition-colors duration-150",
    "[&_svg]:size-3.5 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-primary/15 bg-primary-soft text-primary",

        neutral: "border-border bg-muted text-muted-foreground",

        success:
          "border-success/15 bg-success-soft text-emerald-700 dark:text-emerald-300",

        warning:
          "border-warning/20 bg-warning-soft text-amber-700 dark:text-amber-300",

        destructive:
          "border-destructive/15 bg-destructive-soft text-destructive",

        outline: "border-border bg-transparent text-foreground",
      },
    },

    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        badgeVariants({
          variant,
          className,
        }),
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
