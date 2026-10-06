"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { PanelHeader } from "@/components/panel-header";
import { Card, CardContent } from "@/components/ui/card";
import { CHART_AXIS, CHART_GRID, SINGLE_SERIES_COLOR, chartValue, formatChartNumber, summarizeChartValues } from "@/lib/chart-style";
import { ChartContainer, ChartTooltip, ChartTooltipContent, useChartAnimation, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatValue } from "@/lib/display";
import type { PlayerHistoryPoint, PlayerValuePoint } from "@/lib/roster-audit";

type Range = "recent" | "career";

const config = {
  value: { label: "Value", color: SINGLE_SERIES_COLOR },
} satisfies ChartConfig;

const monthDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const monthYear = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

/**
 * Dynasty value over time.
 *
 * Two series back this: `valueHistory` is ~40 weekly points (the last few months, the view a
 * manager checks before a trade) and `history` is monthly back to the rookie year (the arc that
 * shows whether a price is a peak or a recovery). They answer different questions, so the range
 * toggle swaps the source rather than zooming one of them.
 *
 * Career points carry an overall rank, so that range shows rank in the tooltip — a value of 9,140
 * means nothing on its own, "#4 overall" does.
 */
export function PlayerValueChart({ valueHistory, history, isSuperflex }: { valueHistory: PlayerValuePoint[]; history: PlayerHistoryPoint[]; isSuperflex: boolean }) {
  const animate = useChartAnimation();
  const [range, setRange] = useState<Range>("recent");
  const [format, setFormat] = useState<"sf" | "one_qb">(isSuperflex ? "sf" : "one_qb");

  const hasCareer = history.length > 1;
  const active: Range = hasCareer ? range : "recent";

  const data = useMemo(() => {
    if (active === "career")
      return history.map((point) => ({ date: point.date, value: chartValue(point.value), rankOverall: point.rankOverall, rankPosition: point.rankPosition }));
    return valueHistory.map((point) => ({ date: point.date, value: chartValue(format === "sf" ? point.valueSf : point.value1qb), rankOverall: null, rankPosition: null }));
  }, [active, format, history, valueHistory]);

  if (data.length < 2) return null;

  const stats = summarizeChartValues(data.map((point) => point.value));
  if (!stats || stats.count < 2) return null;
  const change = stats.last - stats.first;
  // A dynasty value never approaches zero, so a zero-based axis wastes the whole plot area on
  // empty space and flattens the line that is the entire point of the chart.
  const min = stats.min;
  const max = stats.max;
  const pad = Math.max(Math.round((max - min) * 0.15), 50);

  return (
    <Card accent>
      <PanelHeader title="Value history" description={<>
          {active === "career" ? "Every month since the rookie season" : "Weekly marks over the last few months"}
          {" · "}
          <span className={change >= 0 ? "text-positive" : "text-negative"}>{change >= 0 ? "+" : ""}{Math.round(change).toLocaleString("en-US")}</span>
          {" over this window"}
        </>} actions={<>
          {/* The career series exists only in SF, so the format toggle hides there rather than
              silently showing SF numbers under a "1QB" label. */}
          {active === "recent" ? (
            <ToggleGroup aria-label="Value format" onValueChange={(next) => { if (next[0]) setFormat(next[0] as "sf" | "one_qb"); }} size="sm" value={[format]} variant="outline">
              <ToggleGroupItem value="sf">SF</ToggleGroupItem>
              <ToggleGroupItem value="one_qb">1QB</ToggleGroupItem>
            </ToggleGroup>
          ) : null}
          {hasCareer ? (
            <ToggleGroup aria-label="Value range" onValueChange={(next) => { if (next[0]) setRange(next[0] as Range); }} size="sm" value={[active]} variant="outline">
              <ToggleGroupItem value="recent">Recent</ToggleGroupItem>
              <ToggleGroupItem value="career">Career</ToggleGroupItem>
            </ToggleGroup>
          ) : null}
        </>} />
      <CardContent>
        <ChartContainer className="aspect-auto h-64 w-full" config={config}>
          <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 4, top: 4 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis {...CHART_AXIS} dataKey="date" minTickGap={32} tickFormatter={active === "career" ? monthYear : monthDay} />
            <YAxis {...CHART_AXIS} domain={[Math.max(0, min - pad), max + pad]} tickFormatter={(entry: number) => formatValue(entry)} width={44} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(entry, _name, item) => {
                    const row = item?.payload as { rankOverall: number | null; rankPosition: number | null } | undefined;
                    const rank = row?.rankOverall ? ` · #${row.rankOverall} overall` : "";
                    return <span className="tabular-nums">{formatChartNumber(entry)}<span className="text-muted-foreground">{rank}</span></span>;
                  }}
                  labelFormatter={(label) => new Date(`${String(label)}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                />
              }
            />
            <Area connectNulls={false} isAnimationActive={animate} dataKey="value" fill="var(--color-value)" fillOpacity={0.12} stroke="var(--color-value)" strokeWidth={2} type="monotone" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
