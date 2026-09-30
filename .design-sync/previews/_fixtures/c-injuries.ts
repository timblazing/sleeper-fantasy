// Batch C fixtures: the league injury report (week 4 of the shared 12-team dynasty league).
import type { InjuryQuery } from "@/lib/injury-query";
import type { InjuryEntry, InjuryReport } from "@/lib/injury-report";
import { game, player } from "./league";

export { LEAGUE_ID } from "./league";

const DNP = "Did Not Participate In Practice";
const LP = "Limited Participation In Practice";
const FP = "Full Participation In Practice";

const entry = (p: ReturnType<typeof player>, fantasyTeam: string, rosterId: number, severity: InjuryEntry["severity"], over: Partial<InjuryEntry> = {}): InjuryEntry => ({
  player: p, fantasyTeam, rosterId, isStarter: false, onInjuredReserve: false, onTaxi: false, severity, value: 4200, game: game(), ...over,
});

export const INJURY_ENTRIES: InjuryEntry[] = [
  entry(player("4866", "Saquon Barkley", "RB", "PHI", { injuryStatus: "Out", injuryBodyPart: "Hamstring", practiceParticipation: DNP }), "Fourth & Long", 4, "out", { isStarter: true, game: game({ opponent: "DAL", detail: "Sun 4:25 PM" }) }),
  entry(player("6786", "CeeDee Lamb", "WR", "DAL", { injuryStatus: "IR", injuryBodyPart: "Shoulder", practiceParticipation: null }), "CeeDeez Nuts", 2, "out", { onInjuredReserve: true, game: game({ opponent: "PHI", home: false, detail: "Sun 4:25 PM" }) }),
  entry(player("11632", "Malik Nabers", "WR", "NYG", { injuryStatus: "Doubtful", injuryBodyPart: "Ankle", practiceParticipation: DNP }), "Turf Monsters", 7, "risk", { isStarter: true, game: game({ opponent: "WAS", detail: "Sun 1:00 PM" }) }),
  entry(player("8150", "Kenneth Walker III", "RB", "SEA", { injuryStatus: "Questionable", injuryBodyPart: "Calf", practiceParticipation: LP }), "The Waddle Waddle", 11, "risk", { isStarter: true, game: game({ opponent: "ARI", home: false, detail: "Sun 4:05 PM" }) }),
  entry(player("4881", "Lamar Jackson", "QB", "BAL", { injuryStatus: "Questionable", injuryBodyPart: "Knee", practiceParticipation: LP }), "Bijan Mustard", 1, "risk", { isStarter: true, game: game({ opponent: "CIN", detail: "Thu 8:15 PM" }) }),
  entry(player("11560", "Brock Bowers", "TE", "LV", { injuryStatus: "Questionable", injuryBodyPart: "Knee", practiceParticipation: FP }), "Fourth & Long", 4, "watch", { isStarter: true, game: game({ opponent: "DEN", home: false, detail: "Mon 8:15 PM" }) }),
  entry(player("12527", "Tetairoa McMillan", "WR", "CAR", { injuryStatus: "Questionable", injuryBodyPart: "Hip", practiceParticipation: FP, age: 22, yearsExp: 0 }), "Puka Shells", 9, "watch", { onTaxi: true, game: game({ opponent: "NO", detail: "Sun 1:00 PM" }) }),
  entry(player("7528", "Christian Watson", "WR", "GB", { injuryStatus: "PUP", injuryBodyPart: null, practiceParticipation: null }), "Kyren Kingdom", 5, "out", { onInjuredReserve: true, game: game({ opponent: "MIN", detail: "Sun 1:00 PM" }) }),
];

export const INJURY_REPORT: InjuryReport = {
  entries: INJURY_ENTRIES, basis: "dynasty", catalogReady: true, valuesReady: true, week: 4,
  summary: { out: 3, risk: 3, watch: 2 }, startersAffected: 5, teams: [],
};

export const INJURY_QUERY: InjuryQuery = { position: "all", search: "", sort: "severity", severities: ["out", "risk", "watch"], startersOnly: false, username: "clayb" };
