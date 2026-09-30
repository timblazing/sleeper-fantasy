import { TeamLink } from "sleeper-fantasy-dashboard";
import { LEAGUE_ID, STANDINGS } from "./_fixtures/league";
import { Stage } from "./_fixtures/stage";

export const RosterLink = () => (
  <Stage className="text-sm font-medium">
    <TeamLink leagueId={LEAGUE_ID} rosterId={4} username="clayb">Fourth & Long</TeamLink>
  </Stage>
);

export const InStandingsList = () => (
  <Stage>
    <ol className="max-w-sm divide-y rounded-xl border bg-card text-sm">
      {STANDINGS.slice(0, 5).map((row) => (
        <li key={row.rosterId} className="flex items-center gap-3 px-4 py-2.5">
          <span className="w-4 text-xs tabular-nums text-muted-foreground">{row.rank}</span>
          <TeamLink className={row.rosterId === 4 ? "block truncate font-semibold text-primary" : "block truncate"} leagueId={LEAGUE_ID} rosterId={row.rosterId} username="clayb">{row.name}</TeamLink>
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">{row.wins}–{row.losses}</span>
        </li>
      ))}
    </ol>
  </Stage>
);

export const InlineSentence = () => (
  <Stage className="text-sm text-muted-foreground">
    2025 champion <TeamLink className="font-semibold text-foreground" leagueId={LEAGUE_ID} rosterId={7}>Turf Monsters</TeamLink>, def. <TeamLink leagueId={LEAGUE_ID} rosterId={1}>Bijan Mustard</TeamLink> 142.8–131.2
  </Stage>
);

export const NoRoster = () => (
  <Stage className="text-sm">
    <TeamLink className="text-muted-foreground" leagueId={LEAGUE_ID} rosterId={null}>Orphaned roster</TeamLink>
  </Stage>
);
