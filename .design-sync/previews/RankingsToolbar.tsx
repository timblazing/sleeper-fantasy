import { RankingsToolbar } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";
import { LEAGUE_ID } from "./_fixtures/league";
import { RANKINGS_QUERY } from "./_fixtures/rankings";

export const DynastyAll = () => <Stage><RankingsToolbar basis="dynasty" leagueId={LEAGUE_ID} query={RANKINGS_QUERY} /></Stage>;

export const RedraftWideReceivers = () => <Stage><RankingsToolbar basis="redraft" leagueId={LEAGUE_ID} query={{ ...RANKINGS_QUERY, position: "WR" }} /></Stage>;

export const RookiesWithSearch = () => <Stage><RankingsToolbar basis="dynasty" leagueId={LEAGUE_ID} query={{ ...RANKINGS_QUERY, position: "rookies", search: "jeanty" }} /></Stage>;

export const AgeFilterApplied = () => <Stage><RankingsToolbar basis="dynasty" leagueId={LEAGUE_ID} query={{ ...RANKINGS_QUERY, position: "RB", minAge: 21, maxAge: 25 }} /></Stage>;
