import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { DashboardWaivers } from "@/components/dashboard-waivers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { DashboardPulse } from "@/lib/dashboard-pulse";
import type { RankingsView } from "@/lib/rankings-data";
import { withUsername } from "@/lib/utils";

export function PlayerBoardContext({ view, pulse, username }: { view: RankingsView; pulse: DashboardPulse | null; username?: string }) {
  return <aside className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-1" aria-label="Player opportunities">
    <DashboardWaivers pulse={pulse} leagueId={view.leagueId} username={username} />
    {view.basis === "dynasty" && view.movers ? <Card>
      <CardHeader><CardTitle>Market movement</CardTitle><CardDescription>Dynasty value changes over seven days</CardDescription></CardHeader>
      <CardContent className="space-y-5">{[{ title: "Rising", players: view.movers.risers, positive: true }, { title: "Falling", players: view.movers.fallers, positive: false }].map(group => <section key={group.title}>
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">{group.title}</h3>
        <ul className="space-y-3">{group.players.slice(0, 3).map(player => <li className="flex items-center gap-3" key={player.sleeperId}>
          <div className="min-w-0 flex-1"><Link className="block truncate text-sm font-medium hover:underline" href={withUsername(`/${view.leagueId}/players/${player.sleeperId}`, username)}>{player.name}</Link><p className="text-xs text-muted-foreground">{player.position} · {player.team ?? "FA"}</p></div>
          <span className={`flex shrink-0 items-center text-xs font-medium tabular-nums ${group.positive ? "text-positive" : "text-negative"}`}>{group.positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{player.trend7d > 0 ? "+" : ""}{player.trend7d.toLocaleString()}</span>
        </li>)}</ul>
      </section>)}</CardContent>
    </Card> : null}
    <Card><CardHeader><CardTitle>{view.basis === "dynasty" ? "Value, not weekly points" : "What PPG+ tells you"}</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed text-muted-foreground">{view.basis === "dynasty" ? "Market value compares long-term assets in your league format. Use weekly projections for lineup and waiver decisions." : "Projected PPR points per game above the replacement starter at each position. A higher number means more scoring advantage; zero is replacement level."}</p></CardContent></Card>
  </aside>;
}
