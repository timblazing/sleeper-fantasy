import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { PanelHeader, PanelLink } from "@/components/panel-header";
import { TeamLink } from "@/components/team-link";
import type { PlayoffPicture } from "@/lib/playoff-odds";
import { cn, withUsername } from "@/lib/utils";

const initials = (name: string) => name.split(/\s|&/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
const pct = (value: number) => (value >= 99.95 ? ">99.9%" : value < 0.05 && value > 0 ? "<0.1%" : `${value.toFixed(1)}%`);

/** Every team's playoff odds, best first. The full race (seeds, schedule) lives on Standings. */
export function DashboardPlayoffs({ picture, leagueId, username, className }: { picture: PlayoffPicture; leagueId: string; username?: string; className?: string }) {
  const sorted = picture.rows.toSorted((a, b) => b.playoffOdds - a.playoffOdds);

  return (
    <Card className={className}>
      <PanelHeader title="Playoff odds" description={`Top ${picture.playoffTeams} of ${picture.teams} teams make the bracket`} actions={<PanelLink href={withUsername(`/${leagueId}/standings`, username)} label="Open standings and playoff race" />} />
      <CardContent className="flex flex-1 flex-col">
        <ol aria-label="Playoff odds" className="flex flex-col divide-y">
          {sorted.map((row, index) => (
            <li key={row.rosterId} className={cn("flex items-center gap-3 py-2.5 first:pt-0 last:pb-0", row.isUser && "-mx-2 rounded-md bg-primary/[0.07] px-2 first:pt-2.5 last:pb-2.5")}>
              <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground">{index + 1}</span>
              <Avatar className="size-6 shrink-0">
                {row.avatar ? <AvatarImage alt="" src={`https://sleepercdn.com/avatars/thumbs/${row.avatar}`} /> : null}
                <AvatarFallback className="text-xs">{initials(row.name)}</AvatarFallback>
              </Avatar>
              <TeamLink className={cn("min-w-0 flex-1 truncate text-sm font-medium", row.isUser && "text-primary")} leagueId={leagueId} rosterId={row.rosterId} username={username}>{row.name}</TeamLink>
              <span className="hidden h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted sm:block">
                <span className={cn("block h-full rounded-full", row.isUser ? "bg-primary" : "bg-muted-foreground/50")} style={{ width: `${Math.min(100, row.playoffOdds)}%` }} />
              </span>
              <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums">{pct(row.playoffOdds)}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
