import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LeagueTeam } from "@/lib/league-values";
import { cn, withUsername } from "@/lib/utils";

const initials = (name: string) => name.split(/\s|&/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

/** One card per team, linking to the roster. Opens as a sheet over this page via the modal route. */
export function TeamsGrid({ teams, leagueId, myRosterId, username, valueLabel, valuesReady }: {
  teams: LeagueTeam[]; leagueId: string; myRosterId?: number; username?: string; valueLabel: string; valuesReady: boolean;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {teams.map((team) => {
        const mine = team.rosterId === myRosterId;
        const games = team.wins + team.losses + team.ties;
        return (
          <li key={team.rosterId} className="min-w-0">
            <Link
              className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={withUsername(`/${leagueId}/teams/${team.rosterId}`, username)}
            >
              <Card className={cn("h-full transition-colors duration-150 group-hover:bg-muted/40", mine && "ring-primary/40")}>
                <div className="flex items-center gap-3 px-(--card-spacing)">
                  <Avatar className="size-11 shrink-0">
                    {team.avatar ? <AvatarImage alt="" src={`https://sleepercdn.com/avatars/thumbs/${team.avatar}`} /> : null}
                    <AvatarFallback className="text-sm">{initials(team.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium group-hover:underline">{team.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{team.manager}</p>
                  </div>
                  {mine ? <Badge className="shrink-0" variant="info">You</Badge> : null}
                </div>
                <dl className="mt-auto grid grid-cols-3 gap-2 border-t px-(--card-spacing) pt-(--card-spacing)">
                  <div>
                    <dt className="text-xs text-muted-foreground">Record</dt>
                    <dd className="text-sm font-medium tabular-nums">{team.wins}–{team.losses}{team.ties ? `–${team.ties}` : ""}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">PPG</dt>
                    <dd className="text-sm font-medium tabular-nums">{games ? (team.pointsFor / games).toFixed(1) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="truncate text-xs text-muted-foreground">{valueLabel}</dt>
                    <dd className="text-sm font-medium tabular-nums">{valuesReady ? `#${team.valueRank}` : "—"}</dd>
                  </div>
                </dl>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
