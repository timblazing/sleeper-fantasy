import { RankingsSearch } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";
import { LEAGUE_ID } from "./_fixtures/league";
import { RANKINGS_QUERY } from "./_fixtures/rankings";

export const Empty = () => <Stage><div style={{ maxWidth: 320 }}><RankingsSearch leagueId={LEAGUE_ID} query={RANKINGS_QUERY} /></div></Stage>;

export const WithTerm = () => <Stage><div style={{ maxWidth: 320 }}><RankingsSearch leagueId={LEAGUE_ID} query={{ ...RANKINGS_QUERY, search: "Puka Nacua" }} /></div></Stage>;

export const InFilterRow = () => (
  <Stage>
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">480 players</span>
      <RankingsSearch leagueId={LEAGUE_ID} query={{ ...RANKINGS_QUERY, search: "gibbs" }} />
    </div>
  </Stage>
);
