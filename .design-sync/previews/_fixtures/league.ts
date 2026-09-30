// Shared preview fixtures: one realistic 12-team dynasty league, reused across previews so the
// cards read as one coherent app. Types come from the app (type-only imports, erased at build).
import type { MatchupDetail, MatchupSide, NflPlayer, PlayerGame, RosterSlot, StandingRow } from "@/lib/types";

export const LEAGUE_ID = "1180245387261214720";

export const player = (id: string, name: string, position: string, team: string, over: Partial<NflPlayer> = {}): NflPlayer => ({
  id, name, position, team, age: 25, yearsExp: 3, injuryStatus: null, injuryBodyPart: null, practiceParticipation: null,
  number: null, espnId: null, searchRank: null, depthChartOrder: 1, status: "Active", ...over,
});

export const game = (over: Partial<PlayerGame> = {}): PlayerGame => ({
  opponent: "KC", home: true, kickoff: "2026-09-27T17:00:00Z", state: "pre", detail: "Sun 1:00 PM", bye: false, ...over,
});

export const standing = (rank: number, rosterId: number, name: string, manager: string, wins: number, losses: number, pointsFor: number, over: Partial<StandingRow> = {}): StandingRow => ({
  rank, rosterId, division: 1, name, manager, avatar: null, wins, losses, ties: 0, pointsFor, pointsAgainst: pointsFor - 40 + rank * 9, value: null, ...over,
});

export const STANDINGS: StandingRow[] = [
  standing(1, 4, "Fourth & Long", "clayb", 3, 0, 412.6),
  standing(2, 7, "Turf Monsters", "gridirongreg", 3, 0, 398.2),
  standing(3, 1, "Bijan Mustard", "sarahk", 2, 1, 387.9),
  standing(4, 11, "The Waddle Waddle", "mikeyt", 2, 1, 371.4),
  standing(5, 2, "CeeDeez Nuts", "jlo_ff", 2, 1, 366.0),
  standing(6, 9, "Puka Shells", "dynastydan", 2, 1, 352.8),
  standing(7, 5, "Kyren Kingdom", "rachelw", 1, 2, 349.1),
  standing(8, 12, "London Calling", "tbone", 1, 2, 340.5),
  standing(9, 3, "Brock Solid", "nate_b", 1, 2, 331.7),
  standing(10, 8, "Jahmyr Gibbs Wat", "kevo", 1, 2, 322.3),
  standing(11, 6, "Tank Commander", "alexr", 0, 3, 301.9),
  standing(12, 10, "Run CMC", "petey", 0, 3, 288.4),
];

const slot = (s: string, p: NflPlayer, points: number | null, projection: number, g: Partial<PlayerGame> = {}): RosterSlot => ({
  slot: s, player: p, points, projection, projectionOpponent: g.opponent ?? "KC", projectionHome: g.home ?? true, game: game(g),
});

const side = (team: StandingRow, score: number, projectedScore: number, slots: RosterSlot[]): MatchupSide => ({ team, score, projectedScore, slots, benchPoints: 21.4 });

export const HOME_SLOTS: RosterSlot[] = [
  slot("QB", player("4984", "Josh Allen", "QB", "BUF"), 24.8, 23.1, { state: "post", opponent: "MIA", detail: "Final" }),
  slot("RB", player("9509", "Bijan Robinson", "RB", "ATL"), 18.2, 17.6, { state: "in", opponent: "TB", detail: "Q3 8:12", period: 3, clockSeconds: 492 }),
  slot("RB", player("8155", "Breece Hall", "RB", "NYJ"), 9.4, 14.2, { state: "in", opponent: "NE", home: false, detail: "Q2 1:45", period: 2, clockSeconds: 105 }),
  slot("WR", player("6794", "Justin Jefferson", "WR", "MIN"), null, 16.8, { state: "pre", opponent: "GB", detail: "Sun 4:25 PM" }),
  slot("WR", player("9493", "Puka Nacua", "WR", "LAR"), 21.7, 15.9, { state: "post", opponent: "SF", detail: "Final" }),
  slot("TE", player("11604", "Brock Bowers", "TE", "LV"), null, 12.4, { state: "pre", opponent: "DEN", home: false, detail: "Mon 8:15 PM" }),
  slot("FLEX", player("8146", "Garrett Wilson", "WR", "NYJ"), 6.3, 13.0, { state: "in", opponent: "NE", home: false, detail: "Q2 1:45", period: 2, clockSeconds: 105 }),
];

export const AWAY_SLOTS: RosterSlot[] = [
  slot("QB", player("6904", "Jalen Hurts", "QB", "PHI"), 19.6, 21.4, { state: "in", opponent: "DAL", detail: "Q4 3:20", period: 4, clockSeconds: 200 }),
  slot("RB", player("9221", "Jahmyr Gibbs", "RB", "DET"), 22.1, 18.3, { state: "post", opponent: "CHI", detail: "Final" }),
  slot("RB", player("8138", "Kyren Williams", "RB", "LAR"), 11.8, 14.9, { state: "post", opponent: "SF", detail: "Final" }),
  slot("WR", player("7564", "Ja'Marr Chase", "WR", "CIN"), null, 17.9, { state: "pre", opponent: "BAL", detail: "Sun 4:25 PM" }),
  slot("WR", player("9488", "Jaxon Smith-Njigba", "WR", "SEA"), 14.5, 13.8, { state: "in", opponent: "ARI", home: false, detail: "Q3 11:02", period: 3, clockSeconds: 662 }),
  slot("TE", player("8130", "Trey McBride", "TE", "ARI"), 7.2, 11.6, { state: "in", opponent: "SEA", detail: "Q3 11:02", period: 3, clockSeconds: 662 }),
  slot("FLEX", player("7547", "Amon-Ra St. Brown", "WR", "DET"), 16.0, 15.2, { state: "post", opponent: "CHI", detail: "Final" }),
];

const total = (slots: RosterSlot[]) => Math.round(slots.reduce((sum, s) => sum + (s.points ?? 0), 0) * 10) / 10;

export const MATCHUP_LIVE: MatchupDetail = {
  id: 1,
  home: side(STANDINGS[0], total(HOME_SLOTS), 118.6, HOME_SLOTS),
  away: side(STANDINGS[1], total(AWAY_SLOTS), 116.1, AWAY_SLOTS),
  homeWinProbability: 58,
  awayWinProbability: 42,
};

const preSlots = (slots: RosterSlot[]) => slots.map((s) => ({ ...s, points: null, game: game({ state: "pre", opponent: s.game?.opponent ?? "KC", detail: "Sun 1:00 PM" }) }));

export const MATCHUP_PREGAME: MatchupDetail = {
  id: 2,
  home: side(STANDINGS[2], 0, 121.3, preSlots(HOME_SLOTS)),
  away: side(STANDINGS[3], 0, 109.8, preSlots(AWAY_SLOTS)),
  homeWinProbability: 67,
  awayWinProbability: 33,
};

export const MATCHUP_FINAL: MatchupDetail = {
  id: 3,
  home: side(STANDINGS[4], 131.2, 117.0, HOME_SLOTS.map((s) => ({ ...s, points: s.points ?? 12.1, game: game({ state: "post", detail: "Final" }) }))),
  away: side(STANDINGS[5], 104.7, 120.4, AWAY_SLOTS.map((s) => ({ ...s, points: s.points ?? 8.4, game: game({ state: "post", detail: "Final" }) }))),
  homeWinProbability: 100,
  awayWinProbability: 0,
};
