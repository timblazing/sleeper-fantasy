import { InjurySearch } from "sleeper-fantasy-dashboard";
import { INJURY_QUERY, LEAGUE_ID } from "./_fixtures/c-injuries";
import { Stage } from "./_fixtures/stage";

const Frame = ({ children }: { children: React.ReactNode }) => <Stage><div style={{ width: 320 }}>{children}</div></Stage>;

export const Empty = () => <Frame><InjurySearch leagueId={LEAGUE_ID} query={INJURY_QUERY} /></Frame>;

export const WithTerm = () => <Frame><InjurySearch leagueId={LEAGUE_ID} query={{ ...INJURY_QUERY, search: "Nabers" }} /></Frame>;
