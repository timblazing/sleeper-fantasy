// Batch C fixtures: the scouting report for the shared 12-team dynasty league, seen from clayb's
// "Fourth & Long" (roster 4). Insight copy follows src/lib/scouting-report.ts's generators.
import type { ManagerProfile, RoomNeed, ScoutInsight, ScoutingReport } from "@/lib/scouting-report";

const room = (position: RoomNeed["position"], rank: number, value: number, leagueAvg: number): RoomNeed => ({ position, rank, value, leagueAvg, starterCount: position === "WR" ? 3 : position === "QB" ? 2 : position === "RB" ? 2 : 1 });

const tendencies = (over: Partial<ManagerProfile["tendencies"]> = {}): ManagerProfile["tendencies"] => ({
  trades: 9, tradesPerYear: 2.3, tradeRank: 4, style: "Active", netPlayerFlow: -2, netPickFlow: 0, waiverClaims: 41, faabSpent: 312,
  activityByDay: [2, 1, 4, 9, 3, 1, 2], busiestDay: "Wednesday", movesPerYear: 14, partners: [], seasonsScanned: 4, ...over,
});

const insight = (id: string, group: ScoutInsight["group"], label: string, tone: ScoutInsight["tone"], strength: ScoutInsight["strength"], title: string, detail: string, thisLeague = true): ScoutInsight => ({ id, group, label, tone, strength, title, detail, thisLeague });

const profile = (over: Partial<ManagerProfile> & Pick<ManagerProfile, "rosterId" | "name" | "manager" | "leverage" | "window">): ManagerProfile => ({
  userId: `u-${over.manager}`, avatar: null, isUser: false, record: { wins: 2, losses: 1, ties: 0 }, valueRank: 6, teams: 12, play: null,
  needs: [], surpluses: [], tendencies: tendencies(), draftTendencies: [], efficiency: null, headToHead: null, crushes: [], otherLeagues: 3, insights: [],
  career: { seasons: 4, winPct: 0.52, championships: 0, playoffAppearances: 2 }, ...over,
});

export const PROFILES: ManagerProfile[] = [
  profile({
    rosterId: 7, name: "Turf Monsters", manager: "gridirongreg", leverage: 78, window: "Contender", record: { wins: 3, losses: 0, ties: 0 }, valueRank: 2,
    play: "Sell RB depth into their critical need (ranked #11 of 12).",
    needs: [room("RB", 11, 6120, 9840), room("TE", 9, 2410, 3380)], surpluses: [room("WR", 1, 24100, 15600), room("QB", 3, 14800, 11900)],
    tendencies: tendencies({ trades: 14, tradesPerYear: 3.5, tradeRank: 1, style: "Hyperactive", netPlayerFlow: 4, netPickFlow: -5 }),
    career: { seasons: 5, winPct: 0.61, championships: 1, playoffAppearances: 4 },
    insights: [
      insight("need-RB", "needs", "ROSTER HOLE", "critical", "strong", "Desperate for RB (ranked #11 of 12)", "6,120 against a 9,840 league average. You are #2 there — they should be willing to overpay."),
      insight("window-contend", "needs", "TEAM WINDOW", "warning", "strong", "Win-now mode — will overpay for missing pieces", "#2 of 12 in roster value. During the playoff push they get desperate; time your offer for maximum leverage."),
      insight("trade-style", "trades", "TRADE STYLE", "positive", "strong", "Hyperactive trader — 14 deals (3.5/yr, #1 of 12 in league)", "They answer offers. Expect a counter within a day, usually asking for a pick sweetener."),
      insight("pick-flow", "trades", "PICK FLOW", "warning", "moderate", "Spending draft capital (-5)", "Has moved five more picks than they have taken back. Futures are the currency they will not ask for."),
      insight("crush-11604", "cross-league", "PLAYER CRUSH", "neutral", "moderate", "Brock Bowers owned in 3 of 4 leagues (75%)", "A player they chase everywhere. Expect a premium if you are the one holding him.", false),
      insight("rivalry", "edge", "RIVALRY", "neutral", "weak", "You are 3–4 against them in 7 meetings", "Last met in Week 14 of 2025, a 9-point loss in the semifinal."),
    ],
  }),
  profile({
    rosterId: 10, name: "Run CMC", manager: "petey", leverage: 64, window: "Rebuilding", record: { wins: 0, losses: 3, ties: 0 }, valueRank: 11,
    play: "Rebuilding and open for business — offer picks for their remaining veterans.",
    needs: [room("QB", 12, 7800, 13400), room("WR", 10, 10200, 15600)], surpluses: [room("RB", 4, 11900, 9840)],
    tendencies: tendencies({ trades: 7, tradesPerYear: 1.8, tradeRank: 6, netPickFlow: 4, netPlayerFlow: -6 }),
  }),
  profile({
    rosterId: 11, name: "The Waddle Waddle", manager: "mikeyt", leverage: 47, window: "Fringe", valueRank: 7,
    play: "Buy TE from their surplus — they are #2 of 12 and can afford to move one.",
    needs: [room("WR", 9, 12400, 15600)], surpluses: [room("TE", 2, 5200, 3380)],
    tendencies: tendencies({ trades: 5, tradesPerYear: 1.3, tradeRank: 8, style: "Selective" }),
  }),
  profile({
    rosterId: 6, name: "Tank Commander", manager: "alexr", leverage: 12, window: "Rebuilding", record: { wins: 0, losses: 3, ties: 0 }, valueRank: 12,
    play: "No completed trades on record — alexr is unlikely to answer. Spend your capital elsewhere.",
    needs: [room("RB", 12, 4300, 9840), room("QB", 10, 9800, 13400), room("TE", 11, 1900, 3380)],
    tendencies: tendencies({ trades: 0, tradesPerYear: 0, tradeRank: 12, style: "Inactive", netPlayerFlow: 0 }),
  }),
  profile({
    rosterId: 4, name: "Fourth & Long", manager: "clayb", leverage: 0, window: "Contender", isUser: true, record: { wins: 3, losses: 0, ties: 0 }, valueRank: 1,
    needs: [room("TE", 8, 2900, 3380)], surpluses: [room("RB", 2, 13100, 9840), room("WR", 3, 19800, 15600)],
    career: { seasons: 5, winPct: 0.64, championships: 2, playoffAppearances: 5 },
  }),
];

export const SCOUTING_REPORT: ScoutingReport = {
  league: { id: "1180245387261214720", name: "Gridiron Dynasty League", season: "2026", teams: 12, superflex: true },
  userRosterId: 4, username: "clayb", profiles: PROFILES, lineage: ["1180245387261214720", "991802135562944512", "917355082105716736", "854098321440182272"],
  seasonsScanned: 4, network: [{ a: 7, b: 4, trades: 3 }, { a: 7, b: 10, trades: 2 }],
  marketSummary: "4 rebuilding, 5 contending, 3 fringe — a seller's market for veteran RBs.",
  marketCounts: { rebuilding: 4, contending: 5, fringe: 3 }, valuesReady: true, historyReady: true, crossLeagueReady: true,
};

/** Logged out: no roster to measure leverage against, so every score is zero and there is no self scout. */
export const SCOUTING_REPORT_ANON: ScoutingReport = {
  ...SCOUTING_REPORT, userRosterId: null, username: undefined, historyReady: false,
  profiles: PROFILES.filter((p) => !p.isUser).slice(0, 3).map((p) => ({ ...p, leverage: 0, play: null, headToHead: null })),
};
