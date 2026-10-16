import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleAlert, Info, TrendingUp, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PanelHeader, PanelLink } from "@/components/panel-header";
import { RosterEdgeChart } from "@/components/roster-edge-chart";
import type { OverviewData } from "@/lib/team-insights";
import { cn, withUsername } from "@/lib/utils";

const INSIGHT_ICON = {
  positive: { icon: TrendingUp, className: "bg-positive/10 text-positive" },
  warning: { icon: TriangleAlert, className: "bg-warning/10 text-warning-foreground" },
  critical: { icon: CircleAlert, className: "bg-negative/10 text-negative" },
  neutral: { icon: Info, className: "bg-muted text-muted-foreground" },
} as const;

export function DashboardRoster({ data, className }: { data: OverviewData; className?: string }) {
  if (!data.team) return null;
  return <Card className={className}>
    <PanelHeader title="Roster edge" description={data.league.isDynasty ? "Position value against the league" : "Projected PPG against the league"} actions={<PanelLink href={withUsername(`/${data.league.id}/teams/${data.team.rosterId}`, data.username)} label="Open your roster" />} />
    <CardContent className="flex flex-1 flex-col">
      {data.valuesReady ? <RosterEdgeChart rooms={data.rooms} scarcity={data.positionScarcity} teams={data.league.teams} isDynasty={data.league.isDynasty} /> : <p className="text-sm text-muted-foreground">Roster values are temporarily unavailable.</p>}
      {data.insights.length ? <ul className="mt-4 space-y-3 border-t pt-4">{data.insights.slice(0, 2).map(insight => {
        const { icon: Icon, className: tone } = INSIGHT_ICON[insight.tone];
        return <li key={insight.id} className="flex gap-3">
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", tone)}><Icon className="size-3.5" aria-hidden="true" /></span>
          <div className="min-w-0"><p className="text-sm font-medium">{insight.title}</p><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{insight.detail}</p></div>
        </li>;
      })}</ul> : null}
    </CardContent>
  </Card>;
}

export function DashboardPriorities({ data, className }: { data: OverviewData; className?: string }) {
  return <Card className={className}>
    <PanelHeader title="Before kickoff" description="Lineup checks and next moves" />
    <CardContent>{data.team && !data.matchup ? <p className="mb-3 text-sm text-muted-foreground">Lineup checks are unavailable. Check your starters in Sleeper.</p> : null}{data.actions.length ? <ul className="divide-y">{data.actions.map(action => <li className="py-3 first:pt-0 last:pb-0" key={action.id}>
      <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium">{action.title}</p><Badge variant={action.tone === "critical" ? "destructive" : action.tone === "warning" ? "warning" : "secondary"} className="shrink-0">{action.label}</Badge></div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{action.detail}</p>
      {action.href ? <Link className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-foreground/80 hover:text-foreground hover:underline" href={action.href}>{action.cta}<ArrowUpRight className="size-3" /></Link> : null}
    </li>)}</ul> : <div className="flex gap-3 py-3">{data.matchup ? <CheckCircle2 className="size-5 shrink-0 text-positive" /> : null}<p className="text-sm text-muted-foreground">{data.team ? data.matchup ? "No lineup warnings found. Check inactives before kickoff." : "Reload to try matchup data again." : "Connect your account to see lineup warnings and roster moves."}</p></div>}</CardContent>
  </Card>;
}
