import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
        secondary: "border border-white/10 bg-white/5 text-muted-foreground",
        destructive: "border border-red-500/30 bg-red-500/10 text-red-400",
        outline: "border border-white/20 text-foreground",
        success: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        warning: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
        info: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
        purple: "border border-purple-500/30 bg-purple-500/10 text-purple-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
