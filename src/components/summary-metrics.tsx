import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Metric, type MetricTone } from "@/components/metric";
import { cn } from "@/lib/utils";

/**
 * A compact first read before a detailed tool, chart, or table. Use actual observations.
 * `color` tints the icon only; it identifies the tile, not a status.
 */
export function SummaryMetrics({ items, className }: {
  items: { label: string; value: ReactNode; detail?: ReactNode; tone?: MetricTone; icon?: LucideIcon; color?: string }[];
  className?: string;
}) {
  return <dl className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5", className)}>
    {items.map(({ icon: Icon, color = "var(--muted-foreground)", ...item }) => <Metric
      key={item.label}
      {...item}
      style={{ "--metric": color } as CSSProperties}
      label={<span className="flex items-center justify-between gap-2">{item.label}{Icon ? <Icon className="size-5 shrink-0 text-(--metric)" aria-hidden="true" /> : null}</span>}
      className="relative gap-1 rounded-xl border border-border bg-card px-4 py-4 sm:px-5"
      valueClassName="text-3xl font-semibold tracking-tight"
    />)}
  </dl>;
}
