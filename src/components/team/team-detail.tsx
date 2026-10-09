"use client";

import { PlayerIdentity } from "@/components/player-identity";
import { PositionBadge } from "@/components/position-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { avatarUrl, headshotUrl, initials } from "@/lib/display";
import type { LeagueTeam, ValuedPlayer } from "@/lib/league-values";
import { basisMeta, type ValueBasis } from "@/lib/value-basis";
import { cn, withUsername } from "@/lib/utils";

type TeamDetailProps = {
  team: LeagueTeam;
  leagueId: string;
  leagueName: string;
  season: string;
  teams: number;
  valuesReady: boolean;
  username?: string;
  basis?: ValueBasis;
};

function TeamHero({ team, leagueName, season, teams, valuesReady, basis = "dynasty" }: Pick<TeamDetailProps, "team" | "leagueName" | "season" | "teams" | "valuesReady" | "basis">) {
  return (
    <header className="px-5 pb-5 pt-6 md:px-7 md:pt-8">
      <div className="flex min-w-0 items-center gap-4 pr-6">
        <Avatar className="size-16 shrink-0 bg-muted md:size-20">
          {team.avatar ? <AvatarImage alt="" src={avatarUrl(team.avatar)} /> : null}
          <AvatarFallback className="text-xl">{initials(team.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{team.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">@{team.manager}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{leagueName} · {season}</p>
      <dl className="mt-5 grid grid-cols-3 gap-4">
        <div><dt className="text-[11px] text-muted-foreground">Record</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{team.wins}-{team.losses}{team.ties ? `-${team.ties}` : ""}</dd></div>
        <div><dt className="text-[11px] text-muted-foreground">{basis === "dynasty" ? "Roster value" : "Roster PPG+"}</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{valuesReady ? `#${team.valueRank}` : "—"}</dd><dd className="text-xs text-muted-foreground">{valuesReady ? `${team.value.toLocaleString("en-US", { maximumFractionDigits: basisMeta(basis).decimals })} · ${teams} teams` : "Unavailable"}</dd></div>
        <div><dt className="text-[11px] text-muted-foreground">Scoring</dt><dd className="mt-1 text-xl font-semibold tabular-nums">#{team.powerRank}</dd><dd className="text-xs text-muted-foreground">{team.pointsFor.toFixed(1)} pts</dd></div>
      </dl>
    </header>
  );
}

function PositionRooms({ team, teams, valuesReady, basis = "dynasty" }: Pick<TeamDetailProps, "team" | "teams" | "valuesReady" | "basis">) {
  return (
    <section className="py-6">
      <h2 className="mb-5 font-heading text-base font-semibold">Position rooms</h2>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {team.rooms.map(room => {
          const strength = teams > 1 ? Math.round(((teams - room.rank) / (teams - 1)) * 100) : 100;
          return <div key={room.position}>
            <div className="flex items-center justify-between gap-3"><PositionBadge position={room.position} /><span className="text-sm font-medium tabular-nums">{valuesReady ? `#${room.rank} / ${teams}` : "—"}</span></div>
            <p className="mt-3 text-xl font-medium tabular-nums">{valuesReady ? room.value.toLocaleString("en-US", { maximumFractionDigits: basisMeta(basis).decimals }) : "—"}<span className="ml-2 text-xs text-muted-foreground">{basisMeta(basis).columnLabel}</span></p>
            {valuesReady ? <Progress aria-label={`${room.position} room strength`} className="mt-2" value={strength} /> : null}
            <p className="mt-2 text-xs text-muted-foreground">{room.players} {room.players === 1 ? "player" : "players"}{room.avgAge == null ? "" : ` · ${room.avgAge.toFixed(1)} avg age`}</p>
          </div>;
        })}
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-6 border-t pt-5"><div><dt className="text-xs text-muted-foreground">Points for</dt><dd className="mt-1 text-lg font-medium tabular-nums">{team.pointsFor.toFixed(1)}</dd></div><div><dt className="text-xs text-muted-foreground">Points against</dt><dd className="mt-1 text-lg font-medium tabular-nums">{team.pointsAgainst.toFixed(1)}</dd></div></dl>
    </section>
  );
}

function rosterGroup(team: LeagueTeam, entry: ValuedPlayer): "Starters" | "Bench" | "Taxi squad" | "Injured reserve" {
  const id = entry.player.id;
  if (team.starters.includes(id)) return "Starters";
  if (team.taxi.includes(id)) return "Taxi squad";
  if (team.reserve.includes(id)) return "Injured reserve";
  return "Bench";
}

function RosterTable({ entries, leagueId, username, valuesReady, basis = "dynasty" }: { entries: ValuedPlayer[]; leagueId: string; username?: string; valuesReady: boolean; basis?: ValueBasis }) {
  return (
    <Table tabIndex={0} aria-label="Team roster">
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead className="hidden w-24 sm:table-cell">Position</TableHead>
          <TableHead className="w-24 text-right">{basisMeta(basis).columnLabel}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.player.id}>
            <TableCell>
              <PlayerIdentity name={entry.player.name} photoUrl={headshotUrl(entry.player)} href={withUsername(`/${leagueId}/players/${entry.player.id}`, username)} metadata={<>{entry.player.team ?? "FA"}{entry.rankPosition ? ` · ${entry.player.position}${entry.rankPosition}` : ""}</>} />
            </TableCell>
            <TableCell className="hidden sm:table-cell"><PositionBadge position={entry.player.position} /></TableCell>
            <TableCell className={cn("pr-4 text-right tabular-nums font-medium", !valuesReady && "text-muted-foreground")}>{valuesReady ? entry.value.toLocaleString("en-US", { maximumFractionDigits: basisMeta(basis).decimals }) : "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TeamRoster({ team, leagueId, username, valuesReady, basis }: Pick<TeamDetailProps, "team" | "leagueId" | "username" | "valuesReady" | "basis">) {
  const groups = ["Starters", "Bench", "Taxi squad", "Injured reserve"] as const;
  if (!team.roster.length) return <Empty className="min-h-64"><EmptyHeader><EmptyTitle>Roster unavailable</EmptyTitle><EmptyDescription>Sleeper did not return any players for this team.</EmptyDescription></EmptyHeader></Empty>;

  return (
    <div className="flex flex-col">
      {groups.map((group) => {
        const entries = team.roster.filter((entry) => rosterGroup(team, entry) === group);
        if (!entries.length) return null;
        return (
          <section className="border-t py-6 first:border-t-0" key={group}>
            <div className="mb-3">
              <div className="flex items-center gap-2"><h2 className="font-heading text-base font-semibold">{group}</h2><Badge variant="secondary">{entries.length}</Badge></div>
            </div>
            <RosterTable entries={entries} leagueId={leagueId} username={username} valuesReady={valuesReady} basis={basis} />
          </section>
        );
      })}
    </div>
  );
}

export function TeamDetail(props: TeamDetailProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TeamHero {...props} />
      <Tabs defaultValue="overview" className="min-h-0 flex-1 gap-0">
        <TabsList variant="line" className="mx-5 w-auto shrink-0 justify-between border-b p-0 group-data-horizontal/tabs:h-11 md:mx-7" aria-label="Team details">
          <TabsTrigger className="rounded-none after:bottom-0" value="overview">Overview</TabsTrigger>
          <TabsTrigger className="rounded-none after:bottom-0" value="roster">Roster</TabsTrigger>
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(24px,env(safe-area-inset-bottom))] md:px-7">
          <TabsContent value="overview"><PositionRooms team={props.team} teams={props.teams} valuesReady={props.valuesReady} basis={props.basis} /></TabsContent>
          <TabsContent value="roster"><TeamRoster leagueId={props.leagueId} team={props.team} username={props.username} valuesReady={props.valuesReady} basis={props.basis} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
