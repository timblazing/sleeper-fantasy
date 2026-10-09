import type { ReactNode } from "react";
import { Metric, type MetricTone } from "@/components/metric";
import { cn } from "@/lib/utils";

/** A compact first read before a detailed tool, chart, or table. Use actual observations. */
export function SummaryMetrics({ items, className }: {
  items: { label: string; value: ReactNode; detail?: ReactNode; tone?: MetricTone }[];
  className?: string;
}) {
  return <dl className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
    {items.map(item => <Metric key={item.label} {...item} className="rounded-xl border bg-card px-4 py-4" valueClassName="text-3xl font-semibold tracking-tight" />)}
  </dl>;
}
