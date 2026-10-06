"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { FilterToolbar } from "@/components/filter-toolbar";
import { Metric } from "@/components/metric";
import { PanelHeader } from "@/components/panel-header";
import { PlayerIdentity } from "@/components/player-identity";
import { PlayerDetail } from "@/components/player/player-detail";
import { PositionBadge } from "@/components/position-badge";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { ResponsiveTabs } from "@/components/responsive-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, useChartAnimation } from "@/components/ui/chart";
import { Disclosure } from "@/components/ui/disclosure";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CHART_AXIS, CHART_GRID, SINGLE_SERIES_COLOR } from "@/lib/chart-style";
import { specimenContext, specimenProfile } from "@/lib/design-specimens";

const views = [{ value: "overview", label: "Overview" }, { value: "production", label: "Production" }, { value: "profile", label: "Profile" }, { value: "market", label: "Market" }];
const chartData = [{ week: "W1", points: 16 }, { week: "W2", points: 0 }, { week: "W3", points: null }, { week: "W4", points: 24 }, { week: "W5", points: 18 }];
const chartConfig = { points: { label: "Points", color: SINGLE_SERIES_COLOR } };

export function ComponentSpecimens({ position = "all" }: { position?: string }) {
  const [view, setView] = useState("overview");
  const [open, setOpen] = useState(false);
  const animate = useChartAnimation();
  return (
    <div className="space-y-8">
      <Card>
        <PanelHeader title="Metrics and status" description="Sentence-case labels, tabular values, and colors with a purpose." actions={<Button variant="outline" onClick={() => setOpen(true)}>Open detail</Button>} />
        <CardContent className="space-y-6">
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="Record" value="4–1" detail="2nd in the league" />
            <Metric label="Projected points" value="128.4" detail="Week 6" />
            <Metric label="Value change" value="+412" tone="positive" detail="Over the last 7 days" />
            <Metric label="Lineup warnings" value="2" tone="warning" detail="Review before kickoff" />
          </dl>
          <div className="flex flex-wrap gap-2"><Badge variant="success">Connected</Badge><Badge variant="warning">Questionable</Badge><Badge variant="destructive">Out</Badge><Badge variant="info">Updated today</Badge><Badge variant="secondary">Your team</Badge></div>
          <div className="flex gap-2">{["QB", "RB", "WR", "TE"].map((position) => <PositionBadge key={position} position={position} />)}</div>
        </CardContent>
      </Card>
      <Card>
        <PanelHeader title="Player board" description="Player identity, URL filters, and accessible row actions." />
        <CardContent className="space-y-4">
          <FilterToolbar value={position} options={["All", "QB", "RB", "WR", "TE", "Picks", "Rookies"].map((label) => ({ label, value: label.toLowerCase(), href: `?position=${label.toLowerCase()}` }))} search={<Input type="search" aria-label="Search example players" placeholder="Search players" className="sm:max-w-64" />} />
          <Table>
            <TableHeader><TableRow><TableHead>Player</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="hidden sm:table-cell">Status</TableHead></TableRow></TableHeader>
            <TableBody><TableRow><TableCell><PlayerIdentity name="Bijan Robinson" position="RB" metadata="ATL · Fourth & Long" /></TableCell><TableCell className="text-right tabular-nums">10,000</TableCell><TableCell className="hidden sm:table-cell"><Badge variant="success">Available</Badge></TableCell></TableRow></TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <PanelHeader title="Views and disclosures" description="Sliding tabs on desktop, a Select on phones, and native expandable content." />
        <CardContent className="space-y-4">
          <Tabs value={view} onValueChange={setView}>
            <ResponsiveTabs items={views} value={view} onValueChange={setView} label="Example player views" />
            {views.map((item) => <TabsContent key={item.value} value={item.value}><p className="py-3 text-sm">{item.label} is selected.</p></TabsContent>)}
          </Tabs>
          <Disclosure summary="How are player values calculated?"><p className="text-sm leading-relaxed text-muted-foreground">RosterAudit values help compare dynasty assets. League format determines which value appears on the player board.</p></Disclosure>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <PanelHeader title="Scoring chart" description="Neutral data, flat fill, a measured zero, and a gap for missing data." />
          <CardContent>
            <ChartContainer config={chartConfig} className="h-56 w-full aspect-auto">
              <AreaChart accessibilityLayer data={chartData}><CartesianGrid {...CHART_GRID} /><XAxis {...CHART_AXIS} dataKey="week" /><YAxis {...CHART_AXIS} width={32} /><ChartTooltip content={<ChartTooltipContent />} /><Area dataKey="points" stroke="var(--color-points)" fill="var(--color-points)" fillOpacity={0.12} connectNulls={false} isAnimationActive={animate} /></AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card><PanelHeader title="Loading" description="A preview of the loading surface." /><CardContent className="space-y-3"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></CardContent></Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Empty className="border"><EmptyHeader><EmptyTitle>No players match these filters</EmptyTitle><EmptyDescription>Clear the filters to see the full board.</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline">Clear filters</Button></EmptyContent></Empty>
        <Empty className="border"><EmptyHeader><EmptyTitle>Player data could not be loaded</EmptyTitle><EmptyDescription>Try again to reload this player’s details.</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline">Try again</Button></EmptyContent></Empty>
      </div>
      <section className="space-y-4 border-t pt-8">
        <h2 className="type-title">Player components</h2>
        <p className="text-sm text-muted-foreground">The same player hero, charts, responsive views, and profile panels used by player pages, with explicit example data.</p>
        <PlayerDetail profile={specimenProfile} context={specimenContext} leagueId="demo" isSuperflex />
      </section>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Player details" description="A centered dialog on desktop and a bottom sheet on phones.">
        <div className="space-y-4"><PlayerIdentity name="Bijan Robinson" position="RB" metadata="ATL · Fourth & Long" /><dl><Metric label="Dynasty value" value="10,000" /></dl><Button variant="outline" onClick={() => setOpen(false)}>Close detail</Button></div>
      </ResponsiveDialog>
    </div>
  );
}
