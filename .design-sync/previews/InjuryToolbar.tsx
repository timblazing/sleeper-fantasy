import { InjuryToolbar } from "sleeper-fantasy-dashboard";
import { INJURY_QUERY, LEAGUE_ID } from "./_fixtures/c-injuries";
import { Stage } from "./_fixtures/stage";

export const AllPositions = () => <Stage><InjuryToolbar leagueId={LEAGUE_ID} query={INJURY_QUERY} /></Stage>;

export const RunningBacks = () => <Stage><InjuryToolbar leagueId={LEAGUE_ID} query={{ ...INJURY_QUERY, position: "RB" }} /></Stage>;

export const Searching = () => <Stage><InjuryToolbar leagueId={LEAGUE_ID} query={{ ...INJURY_QUERY, position: "WR", search: "hamstring" }} /></Stage>;
