// Dynasty rankings board fixtures (values are RosterAudit-scale, 0-10000).
import type { RankingsPickRow, RankingsPlayerRow, RankingsView } from "@/lib/rankings-data";
import type { RankingsQuery } from "@/lib/rankings-query";
import { LEAGUE_ID } from "./league";

export const RANKINGS_QUERY: RankingsQuery = { position: "all", search: "", sort: "value", page: 1 };

const p = (rank: number, sleeperId: string, name: string, position: string, team: string, age: number, value: number, trend7d: number, owner: RankingsPlayerRow["owner"] = null): RankingsPlayerRow => ({
  kind: "player", key: `player-${sleeperId}`, rank, sleeperId, name, position, team, age, tier: rank <= 4 ? 1 : 2, value, trend7d, rankPosition: null, photoUrl: null, owner,
});
const pick = (rank: number, label: string, value: number): RankingsPickRow => ({ kind: "pick", key: `pick-${rank}`, rank, label, value });

export const RANKINGS_ROWS = [
  p(1, "4984", "Josh Allen", "QB", "BUF", 30.3, 10000, 0, { teamName: "Fourth & Long", isMine: true }),
  p(2, "9509", "Bijan Robinson", "RB", "ATL", 24.6, 9820, 212, { teamName: "Bijan Mustard", isMine: false }),
  p(3, "7564", "Ja'Marr Chase", "WR", "CIN", 26.5, 9655, -84, { teamName: "Turf Monsters", isMine: false }),
  p(4, "9493", "Puka Nacua", "WR", "LAR", 25.3, 9410, 318, { teamName: "Fourth & Long", isMine: true }),
  p(5, "9221", "Jahmyr Gibbs", "RB", "DET", 24.5, 9302, 45, { teamName: "Turf Monsters", isMine: false }),
  p(6, "6794", "Justin Jefferson", "WR", "MIN", 27.3, 8988, -410, { teamName: "Fourth & Long", isMine: true }),
  pick(7, "2027 Early 1st", 8105),
  p(8, "11604", "Brock Bowers", "TE", "LV", 23.9, 7954, 156, null),
  p(9, "9488", "Jaxon Smith-Njigba", "WR", "SEA", 24.6, 7710, 0, { teamName: "Turf Monsters", isMine: false }),
  p(10, "6904", "Jalen Hurts", "QB", "PHI", 28.1, 7512, -122, { teamName: "Turf Monsters", isMine: false }),
];

export const RANKINGS_VIEW: RankingsView = {
  leagueId: LEAGUE_ID, leagueName: "Sunday Syndicate", leagueSummary: "12T · SF · PPR", isSuperflex: true,
  basis: "dynasty", presetKey: "sf-ppr", presetLabel: "SF PPR",
  rows: RANKINGS_ROWS, total: 480, totalLabel: "480 players", page: 1, totalPages: 48, maxValue: 10000,
  movers: null, attribution: { text: "Values by RosterAudit.com", url: "https://rosteraudit.com" },
};
