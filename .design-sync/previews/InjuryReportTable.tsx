import { InjuryReportTable } from "sleeper-fantasy-dashboard";
import { INJURY_ENTRIES, INJURY_QUERY, INJURY_REPORT, LEAGUE_ID } from "./_fixtures/c-injuries";
import { Stage } from "./_fixtures/stage";

export const LeagueReport = () => (
  <Stage><InjuryReportTable entries={INJURY_ENTRIES} leagueId={LEAGUE_ID} query={INJURY_QUERY} report={INJURY_REPORT} /></Stage>
);

export const WideReceivers = () => {
  const query = { ...INJURY_QUERY, position: "WR" as const };
  return <Stage><InjuryReportTable entries={INJURY_ENTRIES.filter((e) => e.player.position === "WR")} leagueId={LEAGUE_ID} query={query} report={INJURY_REPORT} /></Stage>;
};

export const NoMatches = () => (
  <Stage>
    <InjuryReportTable entries={[]} leagueId={LEAGUE_ID} query={{ ...INJURY_QUERY, position: "TE", search: "achilles" }} report={INJURY_REPORT} />
  </Stage>
);
