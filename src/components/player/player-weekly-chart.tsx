"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
import { PanelHeader } from "@/components/panel-header";
import { Card, CardContent } from "@/components/ui/card";
import { CHART_AXIS, CHART_GRID, SINGLE_SERIES_COLOR, chartValue, formatChartNumber, summarizeChartValues } from "@/lib/chart-style";
import { ChartContainer, ChartTooltip, ChartTooltipContent, useChartAnimation, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PlayerWeeklyLine } from "@/lib/roster-audit";

const config = { points: { label: "Points", color: SINGLE_SERIES_COLOR } } satisfies ChartConfig;

/**
 * Week-by-week scoring, shaded against the player's own average.
 *
 * A flat bar chart hides the thing that actually decides a start/sit: consistency. Bars above
 * the mean take the stronger neutral tone and bars below take the muted one, so a boom/bust profile
 * reads as an alternating pattern rather than as a wall of identical bars.
 */
export function PlayerWeeklyChart({ weekly, season }: { weekly: PlayerWeeklyLine[]; season: number | null }) {
  const animate = useChartAnimation();
  const [scoring, setScoring] = useState<"ppr" | "standard">("ppr");

  const data = useMemo(
    () => weekly.map((line) => ({ week: line.week, opponent: line.opponent, points: chartValue(scoring === "ppr" ? line.pointsPpr : line.points) })),
    [scoring, weekly],
  );

  if (data.length < 2) return null;

  const stats = summarizeChartValues(data.map((row) => row.points));
  if (!stats) return null;
  const average = stats.average;
  const best = stats.max;

  return (
    <Card accent>
      <PanelHeader title="Weekly scoring" description={<>
          {season ?? "Season"} · {average.toFixed(1)} average, {best.toFixed(1)} best. Bars above the line beat his own average; gaps mean unavailable scores.
        </>} actions={<>
          <ToggleGroup aria-label="Scoring format" onValueChange={(next) => { if (next[0]) setScoring(next[0] as "ppr" | "standard"); }} size="sm" value={[scoring]} variant="outline">
            <ToggleGroupItem value="ppr">PPR</ToggleGroupItem>
            <ToggleGroupItem value="standard">Standard</ToggleGroupItem>
          </ToggleGroup>
        </>} />
      <CardContent>
        <ChartContainer className="aspect-auto h-56 w-full" config={config}>
          <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 4, top: 4 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis {...CHART_AXIS} dataKey="week" tickFormatter={(week: number) => `W${week}`} />
            <YAxis {...CHART_AXIS} tickFormatter={(entry: number) => formatChartNumber(entry)} width={32} />
            <ReferenceLine stroke="var(--border)" strokeDasharray="4 4" y={average} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(entry) => <span className="tabular-nums">{formatChartNumber(entry, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pts</span>}
                  labelFormatter={(label, payload) => {
                    const row = payload?.[0]?.payload as { opponent: string | null } | undefined;
                    return `Week ${label}${row?.opponent ? ` vs ${row.opponent}` : ""}`;
                  }}
                />
              }
            />
            <Bar isAnimationActive={animate} dataKey="points" radius={[4, 4, 0, 0]}>
              {data.map((row) => <Cell fill={row.points != null && row.points >= average ? "var(--color-points)" : "var(--muted-foreground)"} fillOpacity={row.points != null && row.points >= average ? 1 : 0.35} key={row.week} />)}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
