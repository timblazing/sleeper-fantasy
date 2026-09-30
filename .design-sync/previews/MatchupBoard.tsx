import { MatchupBoard } from "sleeper-fantasy-dashboard";
import { MATCHUP_LIVE_BLOWOUT, MATCHUP_LIVE_CLOSE, WEEK_BOARD } from "./_fixtures/b-matchups";
import { LEAGUE_ID, MATCHUP_FINAL, MATCHUP_LIVE, MATCHUP_PREGAME } from "./_fixtures/league";
import { Stage } from "./_fixtures/stage";

const Frame = ({ children }: { children: React.ReactNode }) => <Stage><div className="max-w-2xl">{children}</div></Stage>;

export const FullWeek = () => <Frame><MatchupBoard leagueId={LEAGUE_ID} matchups={WEEK_BOARD} week={4} /></Frame>;

export const SundayInProgress = () => <Frame><MatchupBoard leagueId={LEAGUE_ID} matchups={[MATCHUP_LIVE, MATCHUP_LIVE_CLOSE, MATCHUP_LIVE_BLOWOUT]} week={4} /></Frame>;

export const BeforeKickoff = () => <Frame><MatchupBoard leagueId={LEAGUE_ID} matchups={[MATCHUP_PREGAME]} week={5} /></Frame>;

export const WeekComplete = () => <Frame><MatchupBoard leagueId={LEAGUE_ID} matchups={[MATCHUP_FINAL]} week={3} /></Frame>;
