// Batch B fixtures: extra matchups for the full-week board, a lineup with an empty slot and a team
// defense, and kickoff timestamps relative to "now" so KickoffTime shows each of its formats.
import type { MatchupDetail, RosterSlot } from "@/lib/types";
import { AWAY_SLOTS, HOME_SLOTS, MATCHUP_FINAL, MATCHUP_LIVE, MATCHUP_PREGAME, STANDINGS, game, player } from "./league";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** A kickoff `offsetMs` from now, pinned to a real NFL window (local 1:00 PM by default). */
export const kickoffIn = (offsetMs: number, hour = 13, minute = 0) => {
  const date = new Date(Date.now() + offsetMs);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};
export const KICKOFF_TODAY = (() => {
  // Later today when possible; the capture may run late at night, so clamp to the same day.
  const now = new Date();
  const later = new Date(now);
  later.setHours(20, 15, 0, 0); // Sunday/Monday night window
  if (later.getTime() <= now.getTime()) later.setMinutes(59, 0, 0);
  return later.toISOString();
})();
export const KICKOFF_THIS_WEEK = kickoffIn(3 * DAY);
export const KICKOFF_NEXT_MONTH = kickoffIn(16 * DAY, 16, 25);

const withPoints = (slots: RosterSlot[], extra: number): RosterSlot[] =>
  slots.map((s, i) => ({ ...s, points: s.points == null ? null : Math.round((s.points + ((i * extra) % 7) - 3) * 10) / 10 }));

const total = (slots: RosterSlot[]) => Math.round(slots.reduce((sum, s) => sum + (s.points ?? 0), 0) * 10) / 10;

const liveSide = (index: number, slots: RosterSlot[], projected: number) => ({ team: STANDINGS[index], score: total(slots), projectedScore: projected, slots, benchPoints: 14.2 });

const liveA = withPoints(HOME_SLOTS, 3);
const liveB = withPoints(AWAY_SLOTS, 5);
const liveC = withPoints(AWAY_SLOTS, 2);
const liveD = withPoints(HOME_SLOTS, 4);

export const MATCHUP_LIVE_CLOSE: MatchupDetail = { id: 4, home: liveSide(6, liveA, 112.4), away: liveSide(7, liveB, 113.0), homeWinProbability: 49, awayWinProbability: 51 };
export const MATCHUP_LIVE_BLOWOUT: MatchupDetail = { id: 5, home: liveSide(8, liveC, 121.8), away: liveSide(9, liveD, 97.3), homeWinProbability: 86, awayWinProbability: 14 };

export const WEEK_BOARD: MatchupDetail[] = [MATCHUP_LIVE, MATCHUP_PREGAME, MATCHUP_FINAL, MATCHUP_LIVE_CLOSE, MATCHUP_LIVE_BLOWOUT];

/** A roster that left its FLEX empty and starts a team defense, facing a full lineup. */
export const MATCHUP_EMPTY_SLOT: MatchupDetail = {
  id: 6,
  home: {
    team: STANDINGS[10],
    score: 71.3,
    projectedScore: 96.2,
    benchPoints: 33.8,
    slots: [
      ...HOME_SLOTS.slice(0, 6).map((s) => ({ ...s })),
      { slot: "FLEX", player: null, points: null, projection: null, projectionOpponent: null, projectionHome: null, game: null },
      { slot: "DEF", player: player("PIT", "Pittsburgh Steelers", "DEF", "PIT"), points: 9.0, projection: 7.5, projectionOpponent: "CLE", projectionHome: true, game: game({ state: "post", opponent: "CLE", detail: "Final" }) },
    ],
  },
  away: {
    team: STANDINGS[11],
    score: 88.6,
    projectedScore: 104.5,
    benchPoints: 19.1,
    slots: [
      ...AWAY_SLOTS.map((s) => ({ ...s })),
      { slot: "DEF", player: player("BAL", "Baltimore Ravens", "DEF", "BAL"), points: 4.0, projection: 8.1, projectionOpponent: "CIN", projectionHome: false, game: game({ state: "in", opponent: "CIN", home: false, detail: "Q3 4:51", period: 3, clockSeconds: 291 }) },
    ],
  },
  homeWinProbability: 23,
  awayWinProbability: 77,
};

/** Pregame lineups whose kickoffs are real upcoming timestamps, so each row shows a local time. */
export const MATCHUP_UPCOMING: MatchupDetail = {
  ...MATCHUP_PREGAME,
  id: 7,
  home: { ...MATCHUP_PREGAME.home, slots: MATCHUP_PREGAME.home.slots.map((s, i) => ({ ...s, game: game({ state: "pre", opponent: s.game?.opponent ?? "KC", kickoff: i < 3 ? KICKOFF_THIS_WEEK : kickoffIn(3 * DAY, 16, 25), detail: "Sun 1:00 PM EDT" }) })) },
  away: { ...MATCHUP_PREGAME.away, slots: MATCHUP_PREGAME.away.slots.map((s, i) => ({ ...s, game: game({ state: "pre", opponent: s.game?.opponent ?? "KC", kickoff: i % 2 ? KICKOFF_THIS_WEEK : kickoffIn(4 * DAY, 20, 15), detail: "Sun 1:00 PM EDT" }) })) },
};
