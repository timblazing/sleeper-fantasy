import { HistoryLeaderboard } from "sleeper-fantasy-dashboard";
import { FIRST_SEASON_MANAGERS, HISTORY_SEASONS, LEADERBOARD_ROWS, LEAGUE_ID } from "./_fixtures/c-history";
import { Stage } from "./_fixtures/stage";

export const AllTime = () => (
  <Stage><HistoryLeaderboard leagueId={LEAGUE_ID} rows={LEADERBOARD_ROWS} seasonCount={HISTORY_SEASONS.length} username="clayb" /></Stage>
);

/** A league in its first year: every manager has one season, so the table is that season's standings. */
export const FirstSeason = () => (
  <Stage><HistoryLeaderboard leagueId={LEAGUE_ID} rows={FIRST_SEASON_MANAGERS.filter((row) => row.seasons[0].regularSeasonRank <= 10)} seasonCount={1} /></Stage>
);
