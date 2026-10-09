"use client";

import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, useChartAnimation } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CHART_AXIS, CHART_GRID } from "@/lib/chart-style";
import type { ScoringWeek } from "@/lib/dashboard-pulse";

const config = { mine: { label: "Your team", color: "var(--series-2)" }, average: { label: "League average", color: "var(--muted-foreground)" } };

export function DashboardScoring({ weeks, rosterId, unavailable = false }: { weeks: ScoringWeek[]; rosterId?: number; unavailable?: boolean }) {
  const animation = useChartAnimation();
  const first = weeks[0]?.week ?? 0;
  const last = weeks.at(-1)?.week ?? -1;
  const byWeek = new Map(weeks.map(row => [row.week, row]));
  const rows = Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => {
    const week = first + index;
    const row = byWeek.get(week);
    return { week: `W${week}`, mine: rosterId == null ? null : row?.scores[rosterId] ?? null, average: row?.average ?? null };
  });
  const mine = rows.flatMap(row => row.mine == null ? [] : [row.mine]);
  const avg = mine.length ? mine.reduce((sum, value) => sum + value, 0) / mine.length : null;
  const observed = rows.filter(row => row.mine != null);
  const leagueAvg = observed.length ? observed.reduce((sum, row) => sum + (row.average ?? 0), 0) / observed.length : null;
  const edge = avg != null && leagueAvg != null ? avg - leagueAvg : null;
  return <Card>
    <CardHeader><CardTitle>Scoring form</CardTitle><CardDescription>Last {weeks.length || "six"} completed weeks</CardDescription></CardHeader>
    <CardContent>
      {rows.length ? <>
        <div className="mb-4 flex items-end justify-between gap-2">
          <div><p className="text-3xl font-semibold tracking-tight tabular-nums">{avg?.toFixed(1) ?? (rows.reduce((sum, row) => sum + (row.average ?? 0), 0) / weeks.length).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">pts / week</span></p><p className="mt-1 text-xs text-muted-foreground">{!mine.length ? "League scoring average" : "Your scoring average"}</p></div>
          {edge != null ? <p className={`text-right text-xs font-medium tabular-nums ${edge >= 0 ? "text-positive" : "text-negative"}`}>{edge >= 0 ? "+" : ""}{edge.toFixed(1)}<span className="block font-normal text-muted-foreground">vs league</span></p> : null}
        </div>
        <ChartContainer config={config} className="h-40 w-full aspect-auto" role="group" aria-label="Weekly fantasy points compared with league average">
          <ComposedChart data={rows} margin={{ top: 8, left: -8, right: 4, bottom: 0 }} accessibilityLayer>
            <CartesianGrid {...CHART_GRID} />
            <XAxis {...CHART_AXIS} dataKey="week" />
            <YAxis {...CHART_AXIS} width={48} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="linear" dataKey="mine" stroke="var(--color-mine)" fill="var(--color-mine)" fillOpacity={0.12} strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-mine)", strokeWidth: 0 }} isAnimationActive={animation} />
            <Line type="linear" dataKey="average" stroke="var(--color-average)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={animation} />
          </ComposedChart>
        </ChartContainer>
        {unavailable ? <p className="mt-2 text-xs text-muted-foreground">Some weeks could not be loaded.</p> : null}
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">{rosterId != null ? <span className="flex items-center gap-1.5"><i className="h-0.5 w-3 bg-series-2" />Your team</span> : null}<span className="flex items-center gap-1.5"><i className="w-3 border-t border-dashed border-muted-foreground" />League average</span></div>
      </> : <p className="py-10 text-sm text-muted-foreground">{unavailable ? "Some weekly scores could not be loaded. Reload to try again." : "Completed weekly scores will appear here as the season gets going."}</p>}
    </CardContent>
  </Card>;
}
