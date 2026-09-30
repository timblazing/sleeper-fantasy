import { MatchupSummary } from "sleeper-fantasy-dashboard";
import { LEAGUE_ID, MATCHUP_FINAL, MATCHUP_LIVE, MATCHUP_PREGAME } from "./_fixtures/league";
import { Stage } from "./_fixtures/stage";

const Frame = ({ children }: { children: React.ReactNode }) => (
  <Stage><div className="max-w-2xl rounded-xl border bg-card p-4">{children}</div></Stage>
);

export const Live = () => <Frame><MatchupSummary leagueId={LEAGUE_ID} matchup={MATCHUP_LIVE} /></Frame>;

export const Pregame = () => <Frame><MatchupSummary leagueId={LEAGUE_ID} matchup={MATCHUP_PREGAME} /></Frame>;

export const Final = () => <Frame><MatchupSummary leagueId={LEAGUE_ID} matchup={MATCHUP_FINAL} /></Frame>;
