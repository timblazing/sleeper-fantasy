// Trade-lab fixtures for the shared dynasty league: my roster (Fourth & Long) plus trade partners,
// and canned RosterAudit verdicts for staged deals.
import type { RaTrade } from "@/lib/roster-audit/types";
import type { PickOption, TradeLabData, TradePlayer } from "@/lib/trade-lab";
import { LEAGUE_ID } from "./league";

const tp = (id: string, name: string, position: string, team: string, age: number, value: number): TradePlayer => ({ id, name, position, team, age, value });

const TEAMS: TradeLabData["teams"] = [
  { rosterId: 4, name: "Fourth & Long", manager: "clayb", players: [
    tp("4984", "Josh Allen", "QB", "BUF", 30, 10000), tp("9493", "Puka Nacua", "WR", "LAR", 25, 9410), tp("6794", "Justin Jefferson", "WR", "MIN", 27, 8988),
    tp("8155", "Breece Hall", "RB", "NYJ", 25, 6420), tp("8146", "Garrett Wilson", "WR", "NYJ", 26, 6105), tp("11604", "Brock Bowers", "TE", "LV", 23, 7954),
  ] },
  { rosterId: 7, name: "Turf Monsters", manager: "gridirongreg", players: [
    tp("7564", "Ja'Marr Chase", "WR", "CIN", 26, 9655), tp("9221", "Jahmyr Gibbs", "RB", "DET", 24, 9302), tp("9488", "Jaxon Smith-Njigba", "WR", "SEA", 24, 7710),
    tp("6904", "Jalen Hurts", "QB", "PHI", 28, 7512), tp("8130", "Trey McBride", "TE", "ARI", 26, 6230), tp("8138", "Kyren Williams", "RB", "LAR", 25, 4870),
  ] },
  { rosterId: 1, name: "Bijan Mustard", manager: "sarahk", players: [tp("9509", "Bijan Robinson", "RB", "ATL", 24, 9820), tp("7547", "Amon-Ra St. Brown", "WR", "DET", 26, 8840)] },
  { rosterId: 12, name: "London Calling", manager: "tbone", players: [tp("11632", "Malik Nabers", "WR", "NYG", 23, 8710), tp("4046", "Patrick Mahomes", "QB", "KC", 31, 6010)] },
];

export const TRADE_PICKS: PickOption[] = [
  { season: 2026, round: 1, slot: "early", label: "2026 Early 1st", value: 4210 },
  { season: 2026, round: 1, slot: "mid", label: "2026 Mid 1st", value: 3150 },
  { season: 2026, round: 1, slot: "late", label: "2026 Late 1st", value: 2310 },
  { season: 2026, round: 2, slot: "mid", label: "2026 Mid 2nd", value: 1450 },
  { season: 2027, round: 1, slot: "mid", label: "2027 Mid 1st", value: 3380 },
];

export const TRADE_DATA: TradeLabData = {
  league: { id: LEAGUE_ID, name: "Sunday Syndicate", season: "2026", superflex: true, isDynasty: true, basis: "dynasty" },
  teams: TEAMS, myRosterId: 4, picks: TRADE_PICKS, valuesReady: true, picksReady: true,
};

const ppg = (players: TradePlayer[]) => players.map((p) => ({ ...p, value: Math.round(p.value / 90) / 10 }));
export const TRADE_DATA_REDRAFT: TradeLabData = {
  league: { id: LEAGUE_ID, name: "Sunday Syndicate Redraft", season: "2026", superflex: false, isDynasty: false, basis: "redraft" },
  teams: TEAMS.map((team) => ({ ...team, players: ppg(team.players) })), myRosterId: 4, picks: [], valuesReady: true, picksReady: false,
};

export const TRADE_DATA_NO_VALUES: TradeLabData = {
  ...TRADE_DATA, valuesReady: false, teams: TEAMS.map((team) => ({ ...team, players: team.players.map((p) => ({ ...p, value: 0 })) })),
};

const asset = (name: string, value: number) => ({ name, value }) as unknown as RaTrade["sideA"]["assets"][number];

// Chase + a mid 1st for Jefferson + an early 1st: near-even, with an age flag on the outgoing receiver.
export const TRADE_EVEN: { receive: string[]; send: string[]; trade: RaTrade } = {
  receive: ["Ja'Marr Chase", "2026 Mid 1st"],
  send: ["Justin Jefferson", "2026 Early 1st"],
  trade: {
    sideA: { assets: [asset("Ja'Marr Chase", 9655), asset("2026 Mid 1st", 3150)], value: 12805 },
    sideB: { assets: [asset("Justin Jefferson", 8988), asset("2026 Early 1st", 4210)], value: 13198 },
    verdict: { winner: null, grade: "A", difference: 393, differencePct: 3.0 },
    cliffWarnings: [{
      sleeperId: "6794", name: "Justin Jefferson", position: "WR", riskLevel: "Moderate", riskScore: 42, side: "sending",
      summary: "Elite production today, but receivers entering their late 20s historically shed dynasty value quickly.",
      factors: [{ factor: "age", severity: "medium", detail: "Turns 28 before next season — the start of the WR age curve decline" }, { factor: "injury", severity: "low", detail: "Missed 7 games with a hamstring injury in 2023" }],
    }],
    calculatedAt: "2026-09-28T15:00:00Z",
  },
};

// Gibbs + JSN for Breece Hall + an early 1st: you come out well ahead.
export const TRADE_LOPSIDED: { receive: string[]; send: string[]; trade: RaTrade } = {
  receive: ["Jahmyr Gibbs", "Jaxon Smith-Njigba"],
  send: ["Breece Hall", "2026 Early 1st"],
  trade: {
    sideA: { assets: [asset("Jahmyr Gibbs", 9302), asset("Jaxon Smith-Njigba", 7710)], value: 17012 },
    sideB: { assets: [asset("Breece Hall", 6420), asset("2026 Early 1st", 4210)], value: 10630 },
    verdict: { winner: "sideA", grade: "D", difference: 6382, differencePct: 37.5 },
    cliffWarnings: [],
    calculatedAt: "2026-09-28T15:00:00Z",
  },
};
