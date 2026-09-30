import { PlayoffRace } from "sleeper-fantasy-dashboard";
import { LEAGUE_ID, PICTURE_EARLY, PICTURE_LATE, PICTURE_PRESEASON } from "./_fixtures/c-history";
import { Stage } from "./_fixtures/stage";

export const EarlySeason = () => (
  <Stage><PlayoffRace leagueId={LEAGUE_ID} picture={PICTURE_EARLY} username="clayb" /></Stage>
);

export const StretchRun = () => (
  <Stage><PlayoffRace leagueId={LEAGUE_ID} picture={PICTURE_LATE} username="tbone" /></Stage>
);

export const Preseason = () => (
  <Stage><PlayoffRace leagueId={LEAGUE_ID} picture={PICTURE_PRESEASON} /></Stage>
);
