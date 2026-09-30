import { HistoryChampions } from "sleeper-fantasy-dashboard";
import { FIRST_SEASON_MANAGERS, HISTORY_SEASONS, LEAGUE_ID, MANAGERS } from "./_fixtures/c-history";
import { Stage } from "./_fixtures/stage";

export const TrophyWall = () => (
  <Stage><HistoryChampions leagueId={LEAGUE_ID} managers={MANAGERS} seasons={HISTORY_SEASONS} username="clayb" /></Stage>
);

export const FirstChampion = () => (
  <Stage>
    <HistoryChampions leagueId={LEAGUE_ID} managers={FIRST_SEASON_MANAGERS} seasons={HISTORY_SEASONS.filter((s) => s.season === "2022" || s.season === "2026")} />
  </Stage>
);
