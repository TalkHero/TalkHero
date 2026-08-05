import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center",
    "whitespace-nowrap rounded-md border border-transparent",
    "text-sm font-semibold",
    "transition-[background-color,border-color,color,box-shadow,transform]",
    "duration-150",
    "outline-none select-none",
    "focus-visible:ring-3 focus-visible:ring-ring/35",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3",
    "aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",

        secondary:
          "bg-secondary text-secondary-foreground hover:bg-slate-200 dark:hover:bg-slate-700",

        outline:
          "border-border bg-card text-foreground shadow-sm hover:border-primary/30 hover:bg-primary-soft hover:text-primary",

        ghost:
          "bg-transparent text-foreground hover:bg-muted hover:text-foreground",

        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-red-600",

        success:
          "bg-success text-success-foreground shadow-sm hover:bg-emerald-600",

        link: "h-auto rounded-none border-0 bg-transparent p-0 text-primary underline-offset-4 hover:underline",
      },

      size: {
        default: "h-12 gap-2 px-5",
        xs: "h-8 gap-1.5 rounded-sm px-3 text-xs",
        sm: "h-10 gap-2 px-4 text-sm",
        lg: "h-14 gap-2.5 rounded-lg px-7 text-base",

        icon: "size-12",
        "icon-xs": "size-8 rounded-sm",
        "icon-sm": "size-10",
        "icon-lg": "size-14 rounded-lg",
      },

      width: {
        auto: "w-auto",
        full: "w-full",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
      width: "auto",
    },
  },
);

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant = "default",
  size = "default",
  width = "auto",
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({
          variant,
          size,
          width,
          className,
        }),
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
