import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PanelHeader, PanelLink } from "@/components/panel-header";
import { PositionBadge } from "@/components/position-badge";
import type { OverviewData } from "@/lib/team-insights";
import { cn, withUsername } from "@/lib/utils";

const ROOM_BAR: Record<string, string> = {
  QB: "bg-position-qb-foreground", RB: "bg-position-rb-foreground", WR: "bg-position-wr-foreground", TE: "bg-position-te-foreground",
};

export function DashboardRoster({ data, className }: { data: OverviewData; className?: string }) {
  if (!data.team) return null;
  return <Card className={className}>
    <PanelHeader title="Roster edge" description={data.league.isDynasty ? "Position value against the league" : "Projected PPG against the league"} actions={<PanelLink href={withUsername(`/${data.league.id}/teams/${data.team.rosterId}`, data.username)} label="Open your roster" />} />
    <CardContent className="flex flex-1 flex-col">
      {data.valuesReady ? <div className="grid grid-cols-2 gap-x-5 gap-y-4">{data.rooms.map(room => {
        const relative = room.leagueAvg > 0 ? (room.value / room.leagueAvg - 1) * 100 : null;
        return <div key={room.position}>
          <div className="flex items-center justify-between"><PositionBadge position={room.position} /><span className="text-xs tabular-nums text-muted-foreground">#{room.rank} <span className="text-muted-foreground/60">/ {data.league.teams}</span></span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", ROOM_BAR[room.position] ?? "bg-info")} style={{ width: `${Math.max(0, Math.min(100, room.leagueAvg ? room.value / (room.leagueAvg * 2) * 100 : 0))}%` }} /></div>
          <p className={cn("mt-1.5 text-xs tabular-nums", relative == null ? "text-muted-foreground" : relative >= 0 ? "text-positive" : "text-negative")}>{relative == null ? "No league baseline" : `${relative >= 0 ? "+" : ""}${relative.toFixed(0)}% vs average`}</p>
        </div>;
      })}</div> : <p className="text-sm text-muted-foreground">Roster values are temporarily unavailable.</p>}
      {data.insights.length ? <div className="mt-auto space-y-3 pt-5"><div className="space-y-3 border-t pt-4">{data.insights.slice(0, 2).map(insight => <div key={insight.id}><p className="text-sm font-medium">{insight.title}</p><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{insight.detail}</p></div>)}</div></div> : null}
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
