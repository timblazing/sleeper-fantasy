import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { PositionBadge } from "@/components/position-badge";
import type { OverviewData } from "@/lib/team-insights";

export function DashboardRoster({ data }: { data: OverviewData }) {
  if (!data.team) return null;
  return <Card>
    <CardHeader><CardTitle>Roster edge</CardTitle><CardDescription>{data.league.isDynasty ? "Position value against the league" : "Projected PPG+ against the league"}</CardDescription></CardHeader>
    <CardContent>
      {data.valuesReady ? <div className="grid grid-cols-2 gap-x-5 gap-y-4">{data.rooms.map(room => {
        const relative = room.leagueAvg > 0 ? (room.value / room.leagueAvg - 1) * 100 : null;
        return <div key={room.position}><div className="flex justify-between items-center"><PositionBadge position={room.position} /><span className="text-xs tabular-nums text-muted-foreground">#{room.rank} / {data.league.teams}</span></div><div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-info" style={{ width: `${Math.max(0, Math.min(100, room.leagueAvg ? room.value / (room.leagueAvg * 2) * 100 : 0))}%` }} /></div><p className={`mt-1.5 text-xs tabular-nums ${relative != null && relative >= 0 ? "text-positive" : "text-muted-foreground"}`}>{relative == null ? "No league baseline" : `${relative >= 0 ? "+" : ""}${relative.toFixed(0)}% vs average`}</p></div>;
      })}</div> : <p className="text-sm text-muted-foreground">Roster values are temporarily unavailable.</p>}
      {data.insights.length ? <div className="mt-5 space-y-4 border-t pt-4">{data.insights.slice(0, 2).map(insight => <div key={insight.id}><p className="text-sm font-medium">{insight.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.detail}</p></div>)}</div> : null}
    </CardContent>
  </Card>;
}

export function DashboardPriorities({ data }: { data: OverviewData }) {
  return <Card>
    <CardHeader><CardTitle>Before kickoff</CardTitle><CardDescription>Lineup checks and your next moves</CardDescription><CardAction><Badge variant="secondary">{data.actions.length} {data.actions.length === 1 ? "priority" : "priorities"}</Badge></CardAction></CardHeader>
    <CardContent>{data.team && !data.matchup ? <p className="mb-3 text-sm text-muted-foreground">Lineup checks are unavailable. Check your starters in Sleeper.</p> : null}{data.actions.length ? <ul className="divide-y">{data.actions.map(action => <li className="py-3 first:pt-0 last:pb-0" key={action.id}><Badge variant={action.tone === "critical" ? "destructive" : action.tone === "warning" ? "warning" : "secondary"} className="mb-2">{action.label}</Badge><p className="text-sm font-medium">{action.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{action.detail}</p>{action.href ? <Link className="mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline" href={action.href}>{action.cta}<ArrowUpRight className="size-3" /></Link> : null}</li>)}</ul> : <div className="flex gap-3 py-3">{data.matchup ? <CheckCircle2 className="size-5 shrink-0 text-positive" /> : null}<p className="text-sm text-muted-foreground">{data.team ? data.matchup ? "No lineup warnings found. Check inactives before kickoff." : "Reload to try matchup data again." : "Connect your account to see lineup warnings and roster moves."}</p></div>}</CardContent>
  </Card>;
}
