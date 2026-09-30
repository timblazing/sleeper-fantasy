// Player detail page fixtures (batch D): two full RosterAudit player profiles with deliberately
// opposite shapes — a young ascending WR1 (Puka Nacua) and an aging, injury-heavy RB
// (Christian McCaffrey) — plus a rookie with almost no production. Type-only imports (erased).
import type { PlayerLeagueContext } from "@/lib/player-league-context";
import type { PlayerHistoryPoint, PlayerProfile, PlayerRankMetric, PlayerSnapWeek, PlayerValuePoint, PlayerWeeklyLine } from "@/lib/roster-audit";

export const D_LEAGUE_ID = "1180245387261214720";

const OPPONENTS = ["DET", "TEN", "PHI", "IND", "SF", "BAL", "JAX", "BYE", "NO", "SEA", "TB", "CAR", "ARI", "DET", "SF", "SEA", "ARI", "ATL"];

/** Weekly marks every 7 days ending 2026-09-27, walked from `start` toward `end` with a little noise. */
function valueSeries(start: number, end: number, oneQbRatio: number, wobble: number): PlayerValuePoint[] {
  const points: PlayerValuePoint[] = [];
  const count = 26;
  const last = new Date("2026-09-27T00:00:00Z").getTime();
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const noise = Math.round(Math.sin(i * 1.7) * wobble + Math.cos(i * 0.9) * wobble * 0.6);
    const valueSf = Math.round(start + (end - start) * t + noise);
    const date = new Date(last - (count - 1 - i) * 7 * 86400000).toISOString().slice(0, 10);
    points.push({ date, valueSf, value1qb: Math.round(valueSf * oneQbRatio) });
  }
  return points;
}

/** Monthly career arc: [yyyy-mm, value, overall rank]. */
const history = (rows: [string, number, number][]): PlayerHistoryPoint[] => rows.map(([month, value, rank]) => ({ date: `${month}-01`, value, rankOverall: rank, rankPosition: null }));

const weekly = (ppr: (number | null)[], recPerWeek: number[]): PlayerWeeklyLine[] =>
  ppr.map((points, i) => ({ week: i + 1, opponent: OPPONENTS[i] === "BYE" ? null : OPPONENTS[i], pointsPpr: points, points: points == null ? null : Math.round((points - (recPerWeek[i] ?? 0)) * 10) / 10, stats: {} })).filter((line) => line.pointsPpr != null);

const snaps = (pcts: (number | null)[]): PlayerSnapWeek[] => pcts.map((pct, i) => ({ week: i + 1, offensePct: pct, offenseSnaps: pct == null ? null : Math.round(pct * 64), opponent: OPPONENTS[i] === "BYE" ? null : OPPONENTS[i] }));

const metric = (key: string, label: string, rank: number, of: number, value: number, percentile: number, why: string, above: string[], below: string[], lowerIsBetter = false): PlayerRankMetric => ({ key, label, rank, of, value, percentile, isElite: percentile >= 90, lowerIsBetter, why, above, below });

// ---------------------------------------------------------------------------------------------
// Puka Nacua — WR, LAR, 25. The page as it looks for a healthy young star.
// ---------------------------------------------------------------------------------------------
export const PUKA: PlayerProfile = {
  player: { sleeperId: "9493", name: "Puka Nacua", position: "WR", team: "LAR", age: 25.3, yearsExp: 3, college: "BYU", heightInches: 74, weightLbs: 210, photoUrl: null },
  value: { valueSf: 9140, value1qb: 9620, tier: 1, tierLabel: "Tier 1 · Cornerstone", rankOverallSf: 6, rankOverall1qb: 3, rankPositionSf: 3, rankPosition1qb: 3, trend7d: 142, trend30d: 386 },
  valueHistory: valueSeries(8420, 9140, 1.052, 90),
  history: history([
    ["2023-05", 3120, 118], ["2023-08", 3480, 104], ["2023-10", 6240, 38], ["2023-12", 7310, 21], ["2024-02", 7650, 17], ["2024-05", 7820, 15],
    ["2024-08", 7980, 13], ["2024-10", 7260, 22], ["2024-12", 7740, 16], ["2025-02", 8010, 12], ["2025-05", 8150, 11], ["2025-08", 8320, 10],
    ["2025-10", 8810, 8], ["2025-12", 9020, 7], ["2026-02", 8890, 7], ["2026-05", 8760, 8], ["2026-08", 8980, 7], ["2026-09", 9140, 6],
  ]),
  cliffRisk: {
    level: "Low", score: 14,
    recommendation: "Hold as a cornerstone. His age curve peaks in 2027–2028, and nothing in his usage signals a decline before the value does.",
    factors: [
      { factor: "age", severity: "low", detail: "25.3 years old — WR production typically holds until 28–29." },
      { factor: "usage", severity: "low", detail: "31% target share and 27% air yards share, both top-5 at the position." },
      { factor: "injury", severity: "moderate", detail: "Missed six games in 2024 with a PCL sprain; no recurrence since." },
    ],
  },
  season: 2025,
  weekly: weekly([22.4, 31.6, 18.2, 26.9, 12.1, 24.7, 29.3, null, 9.8, 21.5, 27.2, 16.4, 33.1, 19.6, 25.8, 14.2, 28.4], [9, 11, 7, 10, 5, 9, 10, 0, 4, 8, 9, 6, 12, 7, 9, 6, 10]),
  summary: null,
  career: [
    { season: 2023, stats: { games_played: 17, targets: 160, receptions: 105, receiving_yards: 1486, receiving_tds: 6, carries: 12, rushing_yards: 89, rushing_tds: 0, fantasy_points_ppr_total: 297.5, fantasy_points_ppr_avg: 17.5 } },
    { season: 2024, stats: { games_played: 11, targets: 106, receptions: 79, receiving_yards: 990, receiving_tds: 3, carries: 9, rushing_yards: 49, rushing_tds: 1, fantasy_points_ppr_total: 204.9, fantasy_points_ppr_avg: 18.6 } },
    { season: 2025, stats: { games_played: 16, targets: 168, receptions: 132, receiving_yards: 1715, receiving_tds: 10, carries: 14, rushing_yards: 97, rushing_tds: 1, fantasy_points_ppr_total: 363.2, fantasy_points_ppr_avg: 22.7 } },
  ],
  projections: [],
  rankMetrics: [
    metric("target_share", "Target share", 3, 96, 0.312, 97, "Share of team pass attempts thrown his way.", ["Ja'Marr Chase", "CeeDee Lamb"], ["Amon-Ra St. Brown"]),
    metric("yprr", "Yards per route run", 2, 96, 3.14, 98, "Receiving yards divided by routes run — the cleanest efficiency read for a receiver.", ["A.J. Brown"], ["Ja'Marr Chase"]),
    metric("ppg_ppr", "PPR points per game", 4, 96, 22.7, 96, "Full-PPR scoring per game played.", ["Ja'Marr Chase", "Justin Jefferson", "CeeDee Lamb"], ["Amon-Ra St. Brown"]),
    metric("catch_rate", "Catch rate", 9, 96, 0.786, 91, "Receptions divided by targets.", ["Amon-Ra St. Brown"], ["Chris Olave"]),
    metric("air_yards_share", "Air yards share", 14, 96, 0.271, 86, "Share of the team's intended air yards.", ["Nico Collins"], ["Drake London"]),
    metric("rz_targets", "Red zone targets", 21, 96, 19, 79, "Targets inside the opponent's 20.", ["Mike Evans"], ["Garrett Wilson"]),
    metric("drop_rate", "Drop rate", 38, 96, 0.052, 61, "Drops per catchable target. Lower is better, so a high percentile is a low drop rate.", ["DK Metcalf"], ["Tee Higgins"], true),
    metric("deep_ypr", "Deep yards per reception", 58, 96, 13.0, 40, "Yards per catch on throws of 20+ air yards.", ["Jaxon Smith-Njigba"], ["Rashee Rice"]),
    metric("td_rate", "Touchdown rate", 67, 96, 0.076, 31, "Touchdowns per reception — the most volatile of these metrics.", ["Jakobi Meyers"], ["Chris Godwin"]),
  ],
  weeklyRanks: [],
  rankSeason: 2025,
  projectionCurve: [
    { year: 2026, value: 9140, confidence: "actual", isActual: true },
    { year: 2027, value: 9380, confidence: "high", isActual: false },
    { year: 2028, value: 9210, confidence: "high", isActual: false },
    { year: 2029, value: 8640, confidence: "medium", isActual: false },
    { year: 2030, value: 7720, confidence: "medium", isActual: false },
    { year: 2031, value: 6380, confidence: "low", isActual: false },
  ],
  projectionSummary: "An elite target earner entering his age-25 season on a pass-first offense. The model projects a two-year plateau near the top of the WR1 tier before a gradual decline starting in 2029; the p10 outcome still finishes as a WR2.",
  outcome: { p90: { finish: "WR1", value: 10240 }, p50: { finish: "WR3", value: 9180 }, p10: { finish: "WR14", value: 7050 }, breakoutPct: 42, bustPct: 6, strategy: "hold", archetype: "elite_alpha", risk: 18 },
  projectedPpg: 15.6, projectedPpgPpr: 21.9,
  injury: {
    grade: "B+", score: 82,
    events: [
      { season: 2024, week: 2, title: "PCL sprain", bodyPart: "Knee", severity: "mo", gamesMissed: 6, detail: "Placed on injured reserve after Week 1; returned in Week 8 without a snap limit." },
      { season: 2024, week: 13, title: "Ankle", bodyPart: "Ankle", severity: "mi", gamesMissed: 0, detail: "Limited in practice, full snap share on Sunday." },
      { season: 2023, week: 16, title: "Hamstring tightness", bodyPart: "Hamstring", severity: "mi", gamesMissed: 0, detail: null },
    ],
    preNfl: [
      { year: 2021, description: "Broken foot at BYU — missed four games.", significance: "low" },
      { year: 2022, description: "Ankle sprain, missed three games.", significance: "low" },
    ],
  },
  contract: { years: 4, yearsLeft: 0, expiryYear: 2026, totalValue: 4_140_000, apy: 1_035_000, guaranteed: 212_000, team: "LAR", isRookieDeal: true, isExpiring: true, otcUrl: null },
  combine: { season: "2023", draftTeam: "LAR", draftRound: "5", draftPick: "177", school: "BYU", forty: "4.57", vertical: "32.5", broadJump: "124", cone: "6.93", shuttle: "4.12", bench: "13" },
  snapsWeekly: snaps([0.94, 0.97, 0.92, 0.95, 0.88, 0.96, 0.98, null, 0.79, 0.93, 0.95, 0.9, 0.99, 0.96, 0.97, 0.94, 0.96]),
  avgSnapPct: 0.93,
  advanced: {
    avg_separation: 3.21, avg_cushion: 6.04, catch_percentage: 78.6, avg_yac: 5.8, avg_yac_above_expectation: 1.14,
    percent_share_of_intended_air_yards: 27.1, avg_intended_air_yards_rec: 9.4, rz_target_rate: 24.3, deep_target_rate: 11.2,
    success_rate: 61.8, third_down_rate: 29.4, play_action_rate: 33.5, shotgun_rate: 71.9, targets_trailing_rate: 32.6, targets_leading_rate: 28.1,
    rz_carry_rate: null,
  },
  tradeMarket: {
    totalTrades: 11, avgCost: 9010, medianCost: 8860,
    trades: [
      { id: "t1", date: "2026-09-21", format: "SF · 12T", cost: { players: [{ id: "4984", name: "Josh Allen", position: "QB" }], picks: [] }, alongside: { players: [], picks: [{ season: "2027", round: 3 }] } },
      { id: "t2", date: "2026-09-14", format: "1QB · 12T", cost: { players: [{ id: "9509", name: "Bijan Robinson", position: "RB" }], picks: [] }, alongside: { players: [], picks: [] } },
      { id: "t3", date: "2026-09-02", format: "SF · 10T", cost: { players: [{ id: "11632", name: "Malik Nabers", position: "WR" }], picks: [{ season: "2027", round: 1 }] }, alongside: { players: [{ id: "4035", name: "Alvin Kamara", position: "RB" }], picks: [] } },
      { id: "t4", date: "2026-08-27", format: "SF · 12T · TEP", cost: { players: [], picks: [{ season: "2027", round: 1 }, { season: "2027", round: 1 }, { season: "2028", round: 2 }] }, alongside: { players: [], picks: [] } },
      { id: "t5", date: "2026-08-19", format: "1QB · 14T", cost: { players: [{ id: "7564", name: "Ja'Marr Chase", position: "WR" }], picks: [] }, alongside: { players: [{ id: "6813", name: "Jonathan Taylor", position: "RB" }], picks: [{ season: "2027", round: 2 }] } },
    ],
  },
  related: {
    similarValue: [
      { sleeperId: "9509", name: "Bijan Robinson", position: "RB", team: "ATL", valueSf: 9260, age: 24.6 },
      { sleeperId: "4984", name: "Josh Allen", position: "QB", team: "BUF", valueSf: 9180, age: 30.3 },
      { sleeperId: "11632", name: "Malik Nabers", position: "WR", team: "NYG", valueSf: 9070, age: 23.1 },
    ],
    sameTier: [
      { sleeperId: "7564", name: "Ja'Marr Chase", position: "WR", team: "CIN", valueSf: 9780, age: 26.6 },
      { sleeperId: "6794", name: "Justin Jefferson", position: "WR", team: "MIN", valueSf: 9420, age: 27.3 },
      { sleeperId: "6786", name: "CeeDee Lamb", position: "WR", team: "DAL", valueSf: 8870, age: 27.5 },
    ],
    teammates: [
      { sleeperId: "2133", name: "Davante Adams", position: "WR", team: "LAR", valueSf: 2410, age: 33.7 },
      { sleeperId: "8150", name: "Kyren Williams", position: "RB", team: "LAR", valueSf: 5120, age: 26.1 },
      { sleeperId: "11565", name: "Matthew Stafford", position: "QB", team: "LAR", valueSf: 1980, age: 38.6 },
    ],
  },
};

export const PUKA_CONTEXT: PlayerLeagueContext = { owner: { rosterId: 9, teamName: "Puka Shells", manager: "dynastydan", isMine: false }, positionMates: ["Garrett Wilson", "DeVonta Smith"], starterSlots: ["WR", "WR", "FLEX"] };
export const PUKA_MINE: PlayerLeagueContext = { owner: { rosterId: 4, teamName: "Fourth & Long", manager: "clayb", isMine: true }, positionMates: [], starterSlots: [] };

// ---------------------------------------------------------------------------------------------
// Christian McCaffrey — RB, SF, 30. Falling value, high cliff risk, long injury log.
// ---------------------------------------------------------------------------------------------
export const CMC: PlayerProfile = {
  player: { sleeperId: "4034", name: "Christian McCaffrey", position: "RB", team: "SF", age: 30.3, yearsExp: 9, college: "Stanford", heightInches: 71, weightLbs: 210, photoUrl: null },
  value: { valueSf: 3860, value1qb: 4310, tier: 5, tierLabel: "Tier 5 · Win-now", rankOverallSf: 71, rankOverall1qb: 58, rankPositionSf: 18, rankPosition1qb: 16, trend7d: -118, trend30d: -412 },
  valueHistory: valueSeries(4720, 3860, 1.116, 70),
  history: history([
    ["2017-05", 5400, 42], ["2018-05", 6900, 18], ["2019-05", 8100, 6], ["2020-05", 9600, 1], ["2021-05", 8700, 4], ["2021-11", 6900, 19],
    ["2022-05", 6400, 24], ["2022-11", 7800, 9], ["2023-05", 8200, 7], ["2023-12", 8600, 5], ["2024-05", 7900, 10], ["2024-10", 6100, 28],
    ["2025-02", 4900, 46], ["2025-08", 4600, 52], ["2025-12", 5100, 44], ["2026-05", 4500, 55], ["2026-09", 3860, 71],
  ]),
  cliffRisk: {
    level: "High", score: 78,
    recommendation: "Sell to a contender while he still returns a late first. At 30 with two recent soft-tissue injuries, the drop in value is more likely to come suddenly than gradually.",
    factors: [
      { factor: "age", severity: "high", detail: "30.3 years old — past the age where RB production historically falls off a cliff." },
      { factor: "workload", severity: "high", detail: "2,700+ career touches, the most of any active running back." },
      { factor: "injury", severity: "high", detail: "Achilles tendinitis and a PCL strain cost him 13 games in 2024." },
      { factor: "usage", severity: "moderate", detail: "Snap share dipped to 61% over the last four games as the backfield split." },
    ],
  },
  season: 2025,
  weekly: weekly([24.1, 19.8, 8.4, 21.6, 17.2, 11.9, 22.8, null, 13.4, 9.1, 18.7, 6.2, 14.9, 10.3, 12.6, 7.8, 11.2], [6, 5, 2, 6, 4, 3, 5, 0, 3, 2, 5, 1, 4, 2, 3, 2, 3]),
  summary: null,
  career: [
    { season: 2021, stats: { games_played: 7, carries: 99, rushing_yards: 442, rushing_tds: 1, targets: 41, receptions: 37, receiving_yards: 343, receiving_tds: 1, fantasy_points_ppr_total: 128.5, fantasy_points_ppr_avg: 18.4 } },
    { season: 2022, stats: { games_played: 17, carries: 244, rushing_yards: 1139, rushing_tds: 8, targets: 108, receptions: 85, receiving_yards: 741, receiving_tds: 5, fantasy_points_ppr_total: 356.4, fantasy_points_ppr_avg: 21.0 } },
    { season: 2023, stats: { games_played: 16, carries: 272, rushing_yards: 1459, rushing_tds: 14, targets: 83, receptions: 67, receiving_yards: 564, receiving_tds: 7, fantasy_points_ppr_total: 391.3, fantasy_points_ppr_avg: 24.5 } },
    { season: 2024, stats: { games_played: 4, carries: 50, rushing_yards: 202, rushing_tds: 0, targets: 19, receptions: 15, receiving_yards: 146, receiving_tds: 0, fantasy_points_ppr_total: 49.8, fantasy_points_ppr_avg: 12.5 } },
    { season: 2025, stats: { games_played: 16, carries: 238, rushing_yards: 961, rushing_tds: 7, targets: 72, receptions: 56, receiving_yards: 488, receiving_tds: 2, fantasy_points_ppr_total: 229.8, fantasy_points_ppr_avg: 14.4 } },
  ],
  projections: [],
  rankMetrics: [
    metric("target_share_rb", "Target share", 8, 64, 0.142, 88, "Share of team pass attempts thrown to him.", ["Alvin Kamara"], ["Jahmyr Gibbs"]),
    metric("ppg_ppr", "PPR points per game", 17, 64, 14.4, 74, "Full-PPR scoring per game played.", ["James Cook"], ["Kenneth Walker III"]),
    metric("rush_share", "Rush share", 19, 64, 0.61, 71, "Share of team carries.", ["Josh Jacobs"], ["Tony Pollard"]),
    metric("ypc", "Yards per carry", 41, 64, 4.04, 36, "Rushing yards per attempt.", ["Najee Harris"], ["Rhamondre Stevenson"]),
    metric("ryoe", "Rush yards over expected", 49, 64, -0.31, 23, "Rushing yards per carry above what blocking and box count predict.", ["Javonte Williams"], ["Zack Moss"]),
    metric("explosive_rate", "Explosive run rate", 53, 64, 0.061, 17, "Share of carries gaining 12+ yards.", ["Ezekiel Elliott"], ["Rico Dowdle"]),
  ],
  weeklyRanks: [],
  rankSeason: 2025,
  projectionCurve: [
    { year: 2026, value: 3860, confidence: "actual", isActual: true },
    { year: 2027, value: 2640, confidence: "medium", isActual: false },
    { year: 2028, value: 1420, confidence: "low", isActual: false },
    { year: 2029, value: 610, confidence: "low", isActual: false },
  ],
  projectionSummary: "Still a volume back when healthy, but efficiency metrics have fallen into the bottom third of the position. The model expects RB2 production this season and a steep value decline after it.",
  outcome: { p90: { finish: "RB8", value: 5200 }, p50: { finish: "RB19", value: 3800 }, p10: { finish: "RB41", value: 1650 }, breakoutPct: 4, bustPct: 38, strategy: "sell", archetype: "aging_workhorse", risk: 74 },
  projectedPpg: 11.2, projectedPpgPpr: 14.1,
  injury: {
    grade: "D", score: 41,
    events: [
      { season: 2025, week: 14, title: "Hamstring strain", bodyPart: "Hamstring", severity: "mi", gamesMissed: 1, detail: "Left the Week 14 game in the third quarter; limited for two weeks after returning." },
      { season: 2024, week: 1, title: "Achilles tendinitis", bodyPart: "Achilles", severity: "ma", gamesMissed: 8, detail: "Opened the season on injured reserve; bilateral Achilles tendinitis." },
      { season: 2024, week: 13, title: "PCL strain", bodyPart: "Knee", severity: "ma", gamesMissed: 5, detail: "Season-ending injury in his fourth game back." },
      { season: 2021, week: 3, title: "Hamstring strain", bodyPart: "Hamstring", severity: "mo", gamesMissed: 5, detail: null },
      { season: 2020, week: 2, title: "High ankle sprain", bodyPart: "Ankle", severity: "se", gamesMissed: 13, detail: "Followed by a shoulder AC-joint sprain and a thigh injury in the same season." },
    ],
    preNfl: [{ year: 2016, description: "Skipped the Sun Bowl to protect draft stock — no injury.", significance: null }],
  },
  contract: { years: 2, yearsLeft: 1, expiryYear: 2027, totalValue: 38_000_000, apy: 19_000_000, guaranteed: 25_000_000, team: "SF", isRookieDeal: false, isExpiring: false, otcUrl: null },
  combine: { season: "2017", draftTeam: "CAR", draftRound: "1", draftPick: "8", school: "Stanford", forty: "4.48", vertical: "37.5", broadJump: "121", cone: "6.57", shuttle: "4.22", bench: "10" },
  snapsWeekly: snaps([0.82, 0.8, 0.74, 0.79, 0.77, 0.71, 0.78, null, 0.72, 0.69, 0.74, 0.58, 0.63, 0.59, 0.62, 0.6, 0.63]),
  avgSnapPct: 0.71,
  advanced: {
    catch_percentage: 77.8, avg_yac: 7.2, avg_yac_above_expectation: -0.42, rz_carry_rate: 31.4, rz_target_rate: 12.8,
    success_rate: 44.6, third_down_rate: 18.3, shotgun_rate: 52.4, avg_separation: null, deep_target_rate: null,
  },
  tradeMarket: {
    totalTrades: 3, avgCost: 3980, medianCost: 3710,
    trades: [
      { id: "c1", date: "2026-09-18", format: "SF · 12T", cost: { players: [], picks: [{ season: "2027", round: 1 }] }, alongside: { players: [], picks: [] } },
      { id: "c2", date: "2026-08-30", format: "1QB · 12T", cost: { players: [{ id: "8138", name: "Rachaad White", position: "RB" }], picks: [{ season: "2027", round: 2 }] }, alongside: { players: [{ id: "5012", name: "Mark Andrews", position: "TE" }], picks: [] } },
      { id: "c3", date: "2026-08-11", format: "SF · 10T", cost: { players: [{ id: "9997", name: "Zay Flowers", position: "WR" }], picks: [] }, alongside: { players: [], picks: [] } },
    ],
  },
  related: {
    similarValue: [
      { sleeperId: "5892", name: "Kyler Murray", position: "QB", team: "ARI", valueSf: 3910, age: 29.1 },
      { sleeperId: "5859", name: "A.J. Brown", position: "WR", team: "PHI", valueSf: 3840, age: 29.3 },
      { sleeperId: "8130", name: "Trey McBride", position: "TE", team: "ARI", valueSf: 3800, age: 26.8 },
    ],
    sameTier: [
      { sleeperId: "4199", name: "Derrick Henry", position: "RB", team: "BAL", valueSf: 2210, age: 32.7 },
      { sleeperId: "4866", name: "Saquon Barkley", position: "RB", team: "PHI", valueSf: 4480, age: 29.6 },
      { sleeperId: "4035", name: "Alvin Kamara", position: "RB", team: "NO", valueSf: 1640, age: 31.2 },
    ],
    teammates: [
      { sleeperId: "8155", name: "Brock Purdy", position: "QB", team: "SF", valueSf: 5820, age: 26.7 },
      { sleeperId: "6801", name: "Brandon Aiyuk", position: "WR", team: "SF", valueSf: 2970, age: 28.5 },
      { sleeperId: "4217", name: "George Kittle", position: "TE", team: "SF", valueSf: 2140, age: 33.0 },
    ],
  },
};

export const CMC_CONTEXT: PlayerLeagueContext = { owner: null, positionMates: [], starterSlots: [] };

// ---------------------------------------------------------------------------------------------
// A 2026 rookie before the season: value and combine only — every production tab is empty.
// ---------------------------------------------------------------------------------------------
export const ROOKIE: PlayerProfile = {
  player: { sleeperId: "12601", name: "Jeremiyah Love", position: "RB", team: "NYJ", age: 21.4, yearsExp: 0, college: "Notre Dame", heightInches: 72, weightLbs: 214, photoUrl: null },
  value: { valueSf: 6120, value1qb: 6780, tier: 3, tierLabel: "Tier 3 · Rising", rankOverallSf: 29, rankOverall1qb: 21, rankPositionSf: 8, rankPosition1qb: 7, trend7d: 0, trend30d: 214 },
  valueHistory: valueSeries(5610, 6120, 1.108, 45),
  history: [],
  cliffRisk: null,
  season: 2026,
  weekly: [],
  summary: null,
  career: [],
  projections: [],
  rankMetrics: [],
  weeklyRanks: [],
  rankSeason: null,
  projectionCurve: [],
  projectionSummary: null,
  outcome: null,
  projectedPpg: null, projectedPpgPpr: null,
  injury: null,
  contract: { years: 4, yearsLeft: 4, expiryYear: 2029, totalValue: 22_400_000, apy: 5_600_000, guaranteed: 22_400_000, team: "NYJ", isRookieDeal: true, isExpiring: false, otcUrl: null },
  combine: { season: "2026", draftTeam: "NYJ", draftRound: "1", draftPick: "7", school: "Notre Dame", forty: "4.36", vertical: "38", broadJump: "128", cone: null, shuttle: null, bench: null },
  snapsWeekly: [], avgSnapPct: null,
  advanced: {},
  tradeMarket: null,
  related: null,
};
