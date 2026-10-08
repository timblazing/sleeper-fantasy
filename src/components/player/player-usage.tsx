"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/player/player-section";
import { CHART_AXIS, CHART_GRID, SINGLE_SERIES_COLOR, chartValue, formatChartNumber, summarizeChartValues } from "@/lib/chart-style";
import { ChartContainer, ChartTooltip, ChartTooltipContent, useChartAnimation, type ChartConfig } from "@/components/ui/chart";
import type { PlayerSnapWeek } from "@/lib/roster-audit";

const config = { snapPct: { label: "Snap share", color: SINGLE_SERIES_COLOR } } satisfies ChartConfig;

/**
 * Snap share by week — the leading indicator of a role changing.
 *
 * Fantasy points lag opportunity: a player losing snaps in weeks 14–16 is a sell before the
 * scoring catches up. Fixed 0–100 domain so the slope is honest rather than auto-scaled to
 * look dramatic.
 */
export function PlayerSnapTrend({ snaps, avgSnapPct }: { snaps: PlayerSnapWeek[]; avgSnapPct: number | null }) {
  const animate = useChartAnimation();
  const data = snaps.map((week) => {
    const share = chartValue(week.offensePct);
    return { week: week.week, opponent: week.opponent, snapPct: share == null ? null : Math.round(share * 100) };
  });
  const stats = summarizeChartValues(data.map((row) => row.snapPct));
  if (!stats || stats.count < 3) return null;

  // Last quarter of the season against the full-year average is the "is the role changing" read.
  const recent = data.filter((row) => row.snapPct != null).slice(-4);
  const recentAvg = summarizeChartValues(recent.map((row) => row.snapPct))!.average;
  const seasonAvg = chartValue(avgSnapPct) != null ? Math.round(avgSnapPct! * 100) : Math.round(stats.average);
  const drift = Math.round(recentAvg - seasonAvg);

  return (
    <Card accent>
      <CardHeader>
        <CardTitle>Snap share trend</CardTitle>
        <CardDescription>
          {seasonAvg}% on the season, {Math.round(recentAvg)}% over the last {recent.length} games
          {drift !== 0 ? <span className={drift > 0 ? "text-positive" : "text-negative"}> ({drift > 0 ? "+" : ""}{drift} pts)</span> : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="aspect-auto h-48 w-full" config={config}>
          <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 4, top: 4 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis {...CHART_AXIS} dataKey="week" tickFormatter={(week: number) => `W${week}`} />
            <YAxis {...CHART_AXIS} domain={[0, 100]} tickFormatter={(entry: number) => `${entry}%`} width={40} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(entry) => <span className="tabular-nums">{formatChartNumber(entry)}% of snaps</span>}
                  labelFormatter={(label, payload) => {
                    const row = payload?.[0]?.payload as { opponent: string | null } | undefined;
                    return `Week ${label}${row?.opponent ? ` vs ${row.opponent}` : ""}`;
                  }}
                />
              }
            />
            <Area connectNulls={false} isAnimationActive={animate} dataKey="snapPct" fill="var(--color-snapPct)" fillOpacity={0.12} stroke="var(--color-snapPct)" strokeWidth={2} type="monotone" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
