import type { PlayerProfile } from "@/lib/roster-audit";
import type { PlayerLeagueContext } from "@/lib/player-league-context";

/** Explicit example data; independent of API availability and never used by league routes. */
export const specimenProfile: PlayerProfile = {
  player: { sleeperId: "9509", name: "Bijan Robinson", position: "RB", team: "ATL", age: 24.6, yearsExp: 3, college: "Texas", heightInches: 71, weightLbs: 215, photoUrl: null },
  value: { valueSf: 10000, value1qb: 9800, tier: 1, tierLabel: "Elite", rankOverallSf: 1, rankOverall1qb: 3, rankPositionSf: 1, rankPosition1qb: 1, trend7d: 412, trend30d: -250 },
  valueHistory: [{ date: "2026-08-01", valueSf: 9200, value1qb: 9000 }, { date: "2026-09-01", valueSf: 9660, value1qb: 9500 }, { date: "2026-10-01", valueSf: 10000, value1qb: 9800 }],
  history: [{ date: "2024-08-01", value: 6200, rankOverall: 22, rankPosition: 8 }, { date: "2025-08-01", value: 8800, rankOverall: 5, rankPosition: 3 }, { date: "2026-08-01", value: 10000, rankOverall: 1, rankPosition: 1 }],
  season: 2026,
  weekly: [16, 0, null, 24, 18].map((points, index) => ({ week: index + 1, opponent: "TB", points, pointsPpr: points, stats: {} })),
  summary: null, career: [], projections: [], rankMetrics: [], weeklyRanks: [], rankSeason: 2026,
  projectionCurve: [{ year: 2026, value: 10000, confidence: "actual", isActual: true }, { year: 2027, value: 9800, confidence: "high", isActual: false }, { year: 2028, value: 9200, confidence: "medium", isActual: false }],
  projectionSummary: "Example projection data for visual review.", projectedPpg: 18.4, projectedPpgPpr: 22.9,
  outcome: { p90: { finish: "RB1", value: 10500 }, p50: { finish: "RB3", value: 9800 }, p10: { finish: "RB8", value: 6400 }, breakoutPct: 35, bustPct: 8, strategy: "hold", archetype: "elite_alpha", risk: 18 },
  cliffRisk: { level: "low", score: 5, recommendation: "No immediate age-related concern.", factors: [] },
  injury: null, combine: null,
  contract: { years: 4, yearsLeft: 1, expiryYear: 2027, totalValue: 21000000, apy: 5250000, guaranteed: 21000000, team: "Falcons", isRookieDeal: true, isExpiring: true, otcUrl: null },
  snapsWeekly: [], avgSnapPct: null, advanced: {}, tradeMarket: null, related: null,
};

export const specimenContext: PlayerLeagueContext = {
  owner: { rosterId: 1, teamName: "Fourth & Long Fantasy Football Club", manager: "SampleManager", isMine: true },
  positionMates: [], starterSlots: [],
};
