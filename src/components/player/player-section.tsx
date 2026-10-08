import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Flat sections for the player sheet, using the same content slots as shared panels. */
export function Card({ className, accent: _accent, ...props }: ComponentProps<"section"> & { accent?: boolean }) {
  void _accent;
  return <section className={cn("flex min-w-0 flex-col gap-4 border-t py-6 first:border-t-0", className)} {...props} />;
}
export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap items-baseline justify-between gap-2", className)} {...props} />;
}
export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("font-heading text-base font-semibold", className)} {...props} />;
}
export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-xs text-muted-foreground", className)} {...props} />;
}
export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("min-w-0", className)} {...props} />;
}

