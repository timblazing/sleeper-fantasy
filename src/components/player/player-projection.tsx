"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/player/player-section";
import { CHART_AXIS, CHART_GRID, SINGLE_SERIES_COLOR, chartValue, formatChartNumber, summarizeChartValues } from "@/lib/chart-style";
import { ChartContainer, ChartTooltip, ChartTooltipContent, useChartAnimation, type ChartConfig } from "@/components/ui/chart";
import { formatValue } from "@/lib/display";
import type { PlayerOutcomeRange, PlayerProjectionPoint } from "@/lib/roster-audit";
import { cn } from "@/lib/utils";

const config = { value: { label: "Projected value", color: SINGLE_SERIES_COLOR } } satisfies ChartConfig;

const STRATEGY_TONE: Record<string, string> = { buy: "text-positive", hold: "text-muted-foreground", sell: "text-negative" };

/** `elite_alpha` → `Elite alpha`. Archetypes arrive as snake_case identifiers. */
const humanise = (text: string) => text.replace(/_/g, " ").replace(/^\w/, (char) => char.toUpperCase());

function OutcomeLeg({ label, finish, value, tone }: { label: string; finish: string | null; value: number | null; tone: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-l pl-3 first:border-l-0 first:pl-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-lg font-medium", tone)}>{finish ?? "—"}</span>
      <span className="text-xs text-muted-foreground tabular-nums">{value == null ? "—" : formatValue(value)}</span>
    </div>
  );
}

/**
 * The forward-looking half of the page: a multi-year value curve plus the spread around it.
 *
 * The curve's first point is `confidence: "actual"` — today's value, not a forecast — so a
 * reference line marks it. Without that split the chart reads as if the whole curve were
 * measured, which is exactly the wrong impression for a projection.
 */
export function PlayerProjection({ curve, outcome, summary, ppg, ppgPpr }: { curve: PlayerProjectionPoint[]; outcome: PlayerOutcomeRange | null; summary: string | null; ppg: number | null; ppgPpr: number | null }) {
  const animate = useChartAnimation();
  if (!curve.length && !outcome && !summary) return null;

  const anchor = curve.find((point) => point.isActual);
  const data = curve.map((point) => ({ ...point, value: chartValue(point.value) }));
  const stats = summarizeChartValues(data.map((point) => point.value));
  const min = stats?.min ?? 0;
  const max = stats?.max ?? 0;
  const pad = Math.max(Math.round((max - min) * 0.15), 100);

  return (
    <Card accent>
      <CardHeader>
        <CardTitle>Dynasty projection</CardTitle>
        <CardDescription>
          Projected value
          {ppgPpr != null ? ` · ${ppgPpr.toFixed(1)} projected PPG (PPR)` : ppg != null ? ` · ${ppg.toFixed(1)} projected PPG` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {stats && stats.count > 1 ? (
          <ChartContainer className="aspect-auto h-52 w-full" config={config}>
            <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 4, top: 4 }}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis {...CHART_AXIS} dataKey="year" />
              <YAxis {...CHART_AXIS} domain={[Math.max(0, min - pad), max + pad]} tickFormatter={(entry: number) => formatValue(entry)} width={44} />
              {anchor ? <ReferenceLine label={{ value: "Today", fontSize: 12, position: "insideTopLeft", fill: "var(--muted-foreground)" }} stroke="var(--border)" strokeDasharray="4 4" x={anchor.year} /> : null}
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(entry, _name, item) => {
                      const row = item?.payload as PlayerProjectionPoint | undefined;
                      return <span className="tabular-nums">{formatChartNumber(entry)}<span className="ml-1 font-sans text-muted-foreground">{row?.isActual ? "actual" : `${row?.confidence ?? ""} confidence`}</span></span>;
                    }}
                  />
                }
              />
              <Area connectNulls={false} isAnimationActive={animate} dataKey="value" fill="var(--color-value)" fillOpacity={0.12} stroke="var(--color-value)" strokeWidth={2} type="monotone" />
            </AreaChart>
          </ChartContainer>
        ) : null}

        {outcome ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <OutcomeLeg finish={outcome.p90?.finish ?? null} label="Ceiling · p90" tone="text-positive" value={outcome.p90?.value ?? null} />
              <OutcomeLeg finish={outcome.p50?.finish ?? null} label="Median · p50" tone="" value={outcome.p50?.value ?? null} />
              <OutcomeLeg finish={outcome.p10?.finish ?? null} label="Floor · p10" tone="text-negative" value={outcome.p10?.value ?? null} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {outcome.strategy ? <span className="inline-flex items-center gap-1.5"><span className="text-muted-foreground">Strategy</span><span className={cn("font-medium", STRATEGY_TONE[outcome.strategy] ?? "")}>{humanise(outcome.strategy)}</span></span> : null}
              {outcome.archetype ? <Badge variant="secondary">{humanise(outcome.archetype)}</Badge> : null}
              {outcome.breakoutPct != null ? <span className="text-muted-foreground">Breakout <span className="font-medium text-positive tabular-nums">{outcome.breakoutPct}%</span></span> : null}
              {outcome.bustPct != null ? <span className="text-muted-foreground">Bust <span className="font-medium text-negative tabular-nums">{outcome.bustPct}%</span></span> : null}
              {outcome.risk != null ? <span className="text-muted-foreground">Risk <span className="font-medium tabular-nums">{outcome.risk}</span></span> : null}
            </div>
          </div>
        ) : null}


      </CardContent>
    </Card>
  );
}
