import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PanelHeader } from "@/components/panel-header";
import { TeamLink } from "@/components/team-link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LeagueTeam } from "@/lib/league-values";
import type { PlayoffRow } from "@/lib/playoff-odds";
import { cn } from "@/lib/utils";

const avatarUrl = (id: string) => `https://sleepercdn.com/avatars/thumbs/${id}`;
const initials = (name: string) => name.split(/\s|&/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
const record = (team: Pick<LeagueTeam, "wins" | "losses" | "ties">) => `${team.wins}–${team.losses}${team.ties ? `–${team.ties}` : ""}`;
const score = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const winPct = (team: LeagueTeam) => {
  const games = team.wins + team.losses + team.ties;
  return games ? (team.wins + team.ties / 2) / games : 0;
};

/** League standings: record first, points for as the tiebreak — the order Sleeper seeds from. */
export function StandingsTable({ teams, odds, playoffTeams, leagueId, myRosterId, username, className }: {
  teams: LeagueTeam[]; odds: PlayoffRow[]; playoffTeams: number; leagueId: string; myRosterId?: number; username?: string; className?: string;
}) {
  const rows = teams.toSorted((a, b) => winPct(b) - winPct(a) || b.pointsFor - a.pointsFor);
  const oddsByRoster = new Map(odds.map((row) => [row.rosterId, row]));

  return (
    <Card className={className}>
      <PanelHeader title="League standings" description={`Ranked by record, then points for · top ${playoffTeams} make the playoffs`} />
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Record</TableHead>
              <TableHead className="text-right max-sm:hidden">PF</TableHead>
              <TableHead className="text-right max-md:hidden">PA</TableHead>
              <TableHead className="text-right max-md:hidden">Power rank</TableHead>
              <TableHead className="text-right max-sm:hidden">Playoffs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((team, index) => {
              const mine = team.rosterId === myRosterId;
              const odd = oddsByRoster.get(team.rosterId);
              const cutline = index + 1 === playoffTeams && index + 1 < rows.length;
              return (
                <TableRow key={team.rosterId} className={cn(mine && "bg-primary/[0.07]", cutline && "border-b-primary/40")}>
                  <TableCell className="text-center tabular-nums text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar>
                        {team.avatar ? <AvatarImage alt="" src={avatarUrl(team.avatar)} /> : null}
                        <AvatarFallback className="text-xs">{initials(team.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <TeamLink className={cn("block break-words text-sm font-medium leading-tight sm:truncate", mine && "text-primary")} leagueId={leagueId} rosterId={team.rosterId} username={username}>{team.name}</TeamLink>
                        <span className="block break-all text-xs leading-tight text-muted-foreground sm:truncate">{team.manager}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{record(team)}</TableCell>
                  <TableCell className="text-right tabular-nums max-sm:hidden">{score(team.pointsFor)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground max-md:hidden">{score(team.pointsAgainst)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground max-md:hidden">#{team.powerRank}</TableCell>
                  <TableCell className="text-right max-sm:hidden">
                    {odd ? <Badge variant={odd.outlook === "locked" ? "success" : odd.outlook === "likely" ? "info" : odd.outlook === "bubble" ? "warning" : odd.outlook === "eliminated" ? "destructive" : "secondary"}>{odd.outlook === "locked" ? "Clinched" : odd.outlook === "likely" ? "Likely" : odd.outlook === "bubble" ? "Bubble" : odd.outlook === "eliminated" ? "Eliminated" : "Long shot"}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
