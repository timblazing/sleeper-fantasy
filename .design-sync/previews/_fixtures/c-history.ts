// Batch C fixtures: league history (managers/seasons/records), playoff picture and season timelines
// for the same 12-team dynasty league used in league.ts. Type-only imports (erased at build).
import type { HistorySeason, ManagerRow, RecordBook, SeasonEntry } from "@/lib/league-history";
import type { PlayoffOutlook, PlayoffPicture, PlayoffRow } from "@/lib/playoff-odds";
import type { SeasonTimeline } from "@/lib/team-insights";
import { LEAGUE_ID, STANDINGS } from "./league";

export { LEAGUE_ID };

export const HISTORY_SEASONS: HistorySeason[] = [
  { leagueId: "1048212399884201984", season: "2026", complete: false, playoffWeekStart: 15, lastScoredWeek: 3 },
  { leagueId: "991802135562944512", season: "2025", complete: true, playoffWeekStart: 15, lastScoredWeek: 17 },
  { leagueId: "917355082105716736", season: "2024", complete: true, playoffWeekStart: 15, lastScoredWeek: 17 },
  { leagueId: "854098321440182272", season: "2023", complete: true, playoffWeekStart: 15, lastScoredWeek: 17 },
  { leagueId: "786211459937222656", season: "2022", complete: true, playoffWeekStart: 15, lastScoredWeek: 17 },
];

// [season, wins, losses, pointsFor, regularSeasonRank, finalRank]
type Line = [string, number, number, number, number, number | null];

const entry = ([season, wins, losses, pointsFor, regularSeasonRank, finalRank]: Line): SeasonEntry => ({
  season, wins, losses, ties: 0, pointsFor, pointsAgainst: pointsFor - (wins - losses) * 11.5, regularSeasonRank, finalRank, champion: finalRank === 1,
});

const withTotals = (row: Omit<ManagerRow, "wins" | "losses" | "ties" | "pointsFor" | "pointsAgainst" | "games" | "pointsPerGame" | "winPct" | "championships" | "playoffAppearances">): ManagerRow => {
  const { seasons } = row;
  const wins = seasons.reduce((s, l) => s + l.wins, 0);
  const losses = seasons.reduce((s, l) => s + l.losses, 0);
  const pointsFor = seasons.reduce((s, l) => s + l.pointsFor, 0);
  const pointsAgainst = seasons.reduce((s, l) => s + l.pointsAgainst, 0);
  const games = wins + losses;
  return {
    ...row, wins, losses, ties: 0, pointsFor, pointsAgainst, games,
    pointsPerGame: games ? pointsFor / games : 0, winPct: games ? wins / games : 0,
    championships: seasons.filter((s) => s.champion).length,
    playoffAppearances: seasons.filter((s) => s.finalRank !== null && s.finalRank <= 6).length,
  };
};

const manager = (ownerId: string, rosterId: number | null, name: string, manager: string, lines: Line[], extra: { wae?: number; eff: number; active?: boolean }): ManagerRow =>
  withTotals({ ownerId, rosterId, name, manager, avatar: null, active: extra.active ?? true, winsAboveExpected: extra.wae ?? 0, managerEfficiency: extra.eff, seasons: lines.map(entry) });

export const MANAGERS: ManagerRow[] = [
  manager("u-clayb", 4, "Fourth & Long", "clayb", [["2026", 3, 0, 412.6, 1, null], ["2025", 10, 4, 1782.4, 2, 1], ["2024", 9, 5, 1701.9, 3, 3], ["2023", 11, 3, 1822.0, 1, 1], ["2022", 8, 6, 1640.3, 5, 4]], { wae: 1.42, eff: 0.64 }),
  manager("u-greg", 7, "Turf Monsters", "gridirongreg", [["2026", 3, 0, 398.2, 2, null], ["2025", 9, 5, 1744.1, 3, 2], ["2024", 10, 4, 1765.5, 1, 1], ["2023", 8, 6, 1690.7, 4, 5], ["2022", 7, 7, 1611.2, 6, 7]], { wae: -0.38, eff: 0.61 }),
  manager("u-sarahk", 1, "Bijan Mustard", "sarahk", [["2026", 2, 1, 387.9, 3, null], ["2025", 11, 3, 1801.6, 1, 3], ["2024", 8, 6, 1688.0, 5, 2], ["2023", 9, 5, 1734.2, 2, 2], ["2022", 10, 4, 1712.8, 1, 1]], { wae: 0.87, eff: 0.66 }),
  manager("u-mikeyt", 11, "The Waddle Waddle", "mikeyt", [["2026", 2, 1, 371.4, 4, null], ["2025", 7, 7, 1640.2, 6, 6], ["2024", 9, 5, 1702.4, 2, 4], ["2023", 6, 8, 1588.9, 8, 8], ["2022", 9, 5, 1680.0, 3, 2]], { wae: 2.11, eff: 0.52 }),
  manager("u-jlo", 2, "CeeDeez Nuts", "jlo_ff", [["2026", 2, 1, 366.0, 5, null], ["2025", 8, 6, 1702.7, 4, 4], ["2024", 7, 7, 1655.3, 7, 6], ["2023", 10, 4, 1760.1, 3, 3], ["2022", 6, 8, 1590.4, 8, 9]], { wae: -1.26, eff: 0.58 }),
  manager("u-dan", 9, "Puka Shells", "dynastydan", [["2026", 2, 1, 352.8, 6, null], ["2025", 8, 6, 1690.0, 5, 5], ["2024", 6, 8, 1602.6, 8, 8], ["2023", 7, 7, 1644.4, 6, 6], ["2022", 8, 6, 1655.9, 4, 3]], { wae: 0.12, eff: 0.53 }),
  manager("u-rachel", 5, "Kyren Kingdom", "rachelw", [["2026", 1, 2, 349.1, 7, null], ["2025", 6, 8, 1611.8, 8, 8], ["2024", 8, 6, 1677.2, 4, 5], ["2023", 7, 7, 1650.3, 5, 4], ["2022", 5, 9, 1552.0, 10, 10]], { wae: -0.71, eff: 0.49 }),
  manager("u-tbone", 12, "London Calling", "tbone", [["2026", 1, 2, 340.5, 8, null], ["2025", 7, 7, 1655.0, 7, 7], ["2024", 7, 7, 1640.8, 6, 7], ["2023", 5, 9, 1570.6, 10, 10], ["2022", 7, 7, 1620.1, 7, 6]], { wae: 0.55, eff: 0.46 }),
  manager("u-nate", 3, "Brock Solid", "nate_b", [["2026", 1, 2, 331.7, 9, null], ["2025", 5, 9, 1580.3, 10, 10], ["2024", 6, 8, 1598.0, 9, 9], ["2023", 8, 6, 1672.5, 7, 7], ["2022", 9, 5, 1694.3, 2, 5]], { wae: 1.03, eff: 0.47 }),
  manager("u-kevo", 8, "Jahmyr Gibbs Wat", "kevo", [["2026", 1, 2, 322.3, 10, null], ["2025", 6, 8, 1601.1, 9, 9], ["2024", 5, 9, 1566.2, 10, 10], ["2023", 6, 8, 1601.8, 9, 9], ["2022", 6, 8, 1583.7, 9, 8]], { wae: -0.24, eff: 0.44 }),
  manager("u-alexr", 6, "Tank Commander", "alexr", [["2026", 0, 3, 301.9, 11, null], ["2025", 4, 10, 1532.6, 11, 11], ["2024", 4, 10, 1520.4, 11, 11], ["2023", 3, 11, 1488.2, 12, 12]], { wae: -1.88, eff: 0.36 }),
  manager("u-petey", 10, "Run CMC", "petey", [["2026", 0, 3, 288.4, 12, null], ["2025", 3, 11, 1498.5, 12, 12], ["2024", 3, 11, 1471.9, 12, 12], ["2023", 4, 10, 1512.0, 11, 11]], { wae: -1.95, eff: 0.33 }),
  manager("u-hank", null, "Hurts So Good", "hankthetank", [["2022", 4, 10, 1502.6, 11, 11]], { wae: -0.9, eff: 0.38, active: false }),
  manager("u-deb", null, "Mixon It Up", "debbie_d", [["2022", 2, 12, 1433.0, 12, 12]], { wae: -2.3, eff: 0.29, active: false }),
];

/** A league's first completed season — one champion, no repeat winners yet. */
export const FIRST_SEASON_MANAGERS: ManagerRow[] = MANAGERS.map((row, i) =>
  withTotals({ ...row, seasons: row.seasons.filter((s) => s.season === "2022"), winsAboveExpected: row.winsAboveExpected * 0.6 + (i % 3 - 1) * 0.4, managerEfficiency: row.managerEfficiency }),
).filter((row) => row.seasons.length);

/** The all-time table as it fits one screen: the top nine active managers plus one former owner. */
export const LEADERBOARD_ROWS: ManagerRow[] = [...MANAGERS.slice(0, 9), MANAGERS[12]];

export const RECORDS: RecordBook = {
  mostPointsSeason: { name: "Fourth & Long", season: "2023", points: 1822.0 },
  fewestPointsSeason: { name: "Mixon It Up", season: "2022", points: 1433.0 },
  bestRecord: { name: "Fourth & Long", season: "2023", wins: 11, losses: 3 },
  worstRecord: { name: "Mixon It Up", season: "2022", wins: 2, losses: 12 },
  longestWinStreak: { name: "Bijan Mustard", length: 9, season: "2025", startWeek: 3, endWeek: 11 },
  longestLossStreak: { name: "Tank Commander", length: 8, season: "2023", startWeek: 1, endWeek: 8 },
  highestScoringLoss: { season: "2024", week: 9, margin: 3.14, winnerName: "Turf Monsters", loserName: "CeeDeez Nuts", winnerScore: 171.48, loserScore: 168.34 },
  lowestScoringWin: { season: "2022", week: 14, margin: 1.9, winnerName: "Run CMC", loserName: "Hurts So Good", winnerScore: 71.22, loserScore: 69.32 },
  biggestBlowout: { season: "2025", week: 6, margin: 98.64, winnerName: "Bijan Mustard", loserName: "Run CMC", winnerScore: 186.1, loserScore: 87.46 },
  closestMatchup: { season: "2024", week: 12, margin: 0.08, winnerName: "The Waddle Waddle", loserName: "Kyren Kingdom", winnerScore: 124.36, loserScore: 124.28 },
};

/** Two seasons in: most records exist but the streak/margin lines are still thin. */
export const RECORDS_EARLY: RecordBook = {
  ...RECORDS,
  mostPointsSeason: { name: "Bijan Mustard", season: "2022", points: 1712.8 },
  bestRecord: { name: "Bijan Mustard", season: "2022", wins: 10, losses: 4 },
  longestWinStreak: null,
  longestLossStreak: null,
  highestScoringLoss: null,
  lowestScoringWin: null,
  biggestBlowout: { season: "2022", week: 8, margin: 71.3, winnerName: "Brock Solid", loserName: "Mixon It Up", winnerScore: 158.9, loserScore: 87.6 },
  closestMatchup: { season: "2022", week: 11, margin: 0.42, winnerName: "Puka Shells", loserName: "London Calling", winnerScore: 118.04, loserScore: 117.62 },
};

// ---- Playoff race ----
// Ten-team views (STANDINGS[0..9]) so the whole table fits one capture viewport.
const outlookFor = (odds: number): PlayoffOutlook => (odds >= 99.95 ? "locked" : odds >= 70 ? "likely" : odds >= 25 ? "bubble" : odds > 0 ? "longshot" : "eliminated");

const ODDS_WEEK3 = [91.4, 88.2, 76.9, 63.5, 58.1, 47.6, 38.2, 22.7, 9.9, 3.5];
const ODDS_WEEK13 = [100, 100, 99.2, 86.4, 71.0, 44.8, 31.5, 0.6, 0.02, 0];

const playoffRow = (index: number, odds: number, weeksPlayed: number, userRosterId: number | null, fixedWins?: number): PlayoffRow => {
  const team = STANDINGS[index];
  const scale = weeksPlayed / 3;
  const wins = fixedWins ?? Math.round(team.wins * scale);
  const losses = weeksPlayed - wins;
  return {
    rosterId: team.rosterId, name: team.name, manager: team.manager, avatar: null, division: 1, isUser: team.rosterId === userRosterId,
    wins, losses, ties: 0, pointsFor: team.pointsFor * scale, ppg: team.pointsFor / 3,
    playoffOdds: odds, titleOdds: odds / 6, byeOdds: odds / 3, averageSeed: 1.4 + index * 0.92,
    projectedWins: wins + (14 - weeksPlayed) * (0.2 + (odds / 100) * 0.55),
    winRange: [wins, wins + 4], seedOdds: [], outlook: outlookFor(odds),
  };
};

const picture = (odds: number[], weeksPlayed: number, userRosterId: number | null, wins?: number[], extra: Partial<PlayoffPicture> = {}): PlayoffPicture => ({
  teams: odds.length, playoffTeams: 6, byeTeams: 2, playoffWeekStart: 15, finalWeek: 17, currentWeek: weeksPlayed + 1, weeksPlayed,
  weeksRemaining: 14 - weeksPlayed, started: weeksPlayed > 0, simulations: 10000,
  rows: odds.map((o, i) => playoffRow(i, o, weeksPlayed, userRosterId, wins?.[i])), remainingSchedule: [], winnersBracket: null, losersBracket: null, path: null,
  leagueName: "Gridiron Dynasty League", season: "2026", ...extra,
});

export const PICTURE_EARLY = picture(ODDS_WEEK3, 3, 4);
export const PICTURE_LATE = picture(ODDS_WEEK13, 13, 12, [11, 10, 9, 8, 8, 7, 7, 5, 4, 3]);
export const PICTURE_PRESEASON = picture([68.4, 66.0, 63.2, 61.7, 60.1, 58.4, 57.9, 56.1, 55.2, 53.0], 0, null);

// ---- Season timeline ----
const markers = (week: number, before = false): SeasonTimeline["markers"] => {
  const list = [
    ...(before ? [{ id: "current-phase", label: "Pre-season", week: 0 }] : []),
    { id: "kickoff", label: "Kickoff", week: 1 },
    { id: "deadline", label: "Trade deadline", week: 11 },
    { id: "playoffs", label: "Playoffs", week: 15 },
    { id: "championship", label: "Championship", week: 17 },
  ];
  const now = before ? 0 : week;
  return list.map((m) => ({ ...m, state: m.week < now ? "past" as const : m.week === now ? "now" as const : "upcoming" as const }));
};

export const TIMELINE_REGULAR: SeasonTimeline = {
  startWeek: 1, endWeek: 17, currentWeek: 4,
  phase: { label: "Regular season", tone: "positive", detail: "Set lineups weekly, work the waiver wire, and track buy-low windows while prices are soft." },
  markers: markers(4),
};

export const TIMELINE_DEADLINE: SeasonTimeline = {
  startWeek: 1, endWeek: 17, currentWeek: 11,
  phase: { label: "Deadline window", tone: "critical", detail: "1 week to buy or sell. Last chance to reshape the roster this season." },
  markers: markers(11),
};

export const TIMELINE_PRESEASON: SeasonTimeline = {
  startWeek: 0, endWeek: 17, currentWeek: 0,
  phase: { label: "Pre-season", tone: "warning", detail: "Lineup tweaks, ADP-aware moves, and identifying breakout candidates before they spike." },
  markers: markers(0, true),
};

export const TIMELINE_PLAYOFFS: SeasonTimeline = {
  startWeek: 1, endWeek: 17, currentWeek: 16,
  phase: { label: "Playoffs", tone: "critical", detail: "Win or go home. Start the highest floor you have and check inactives every week." },
  markers: markers(16),
};
