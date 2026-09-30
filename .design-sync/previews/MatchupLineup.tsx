import { MatchupLineup } from "sleeper-fantasy-dashboard";
import { MATCHUP_EMPTY_SLOT, MATCHUP_UPCOMING } from "./_fixtures/b-matchups";
import { LEAGUE_ID, MATCHUP_FINAL, MATCHUP_LIVE } from "./_fixtures/league";
import { Stage } from "./_fixtures/stage";

// Mirrors the matchup dialog body: a "Starters" header over the side-by-side lineup.
const Frame = ({ children }: { children: React.ReactNode }) => (
  <Stage>
    <div className="max-w-2xl rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">Starters</p>
        <p className="text-xs text-muted-foreground">Live points · projected below</p>
      </div>
      {children}
    </div>
  </Stage>
);

export const LiveSunday = () => <Frame><MatchupLineup leagueId={LEAGUE_ID} matchup={MATCHUP_LIVE} /></Frame>;

export const UpcomingKickoffs = () => <Frame><MatchupLineup leagueId={LEAGUE_ID} matchup={MATCHUP_UPCOMING} /></Frame>;

export const Final = () => <Frame><MatchupLineup leagueId={LEAGUE_ID} matchup={MATCHUP_FINAL} /></Frame>;

export const EmptySlotAndDefense = () => <Frame><MatchupLineup leagueId={LEAGUE_ID} matchup={MATCHUP_EMPTY_SLOT} /></Frame>;
