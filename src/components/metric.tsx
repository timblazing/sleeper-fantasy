import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MetricTone = "neutral" | "positive" | "negative" | "warning" | "info";
const tones: Record<MetricTone, string> = {
  neutral: "text-foreground", positive: "text-positive", negative: "text-negative",
  warning: "text-warning-foreground", info: "text-info-foreground",
};

/** A definition-list item: compose metrics inside a <dl>. */
export function Metric({ label, value, detail, tone = "neutral", className, valueClassName }: {
  label: ReactNode; value: ReactNode; detail?: ReactNode; tone?: MetricTone;
  className?: string; valueClassName?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <dt className="type-label text-muted-foreground">{label}</dt>
      <dd className={cn("type-metric", tones[tone], valueClassName)}>{value}</dd>
      {detail != null ? <dd className="type-caption text-muted-foreground">{detail}</dd> : null}
    </div>
  );
}
