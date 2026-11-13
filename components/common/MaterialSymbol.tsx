import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function MaterialSymbol({
  icon,
  filled = false,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { icon: string; filled?: boolean }) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={cn("material-symbols-outlined", filled && "filled", className)}
    >
      {icon}
    </span>
  );
}
