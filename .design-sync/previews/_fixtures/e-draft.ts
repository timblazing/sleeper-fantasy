// Draft-grade fixtures: the 2025 rookie draft of the shared 12-team dynasty league (3 rounds,
// linear order from worst to best record), graded the way src/lib/draft-grades.ts does it.
import type { DraftCareerRow, DraftGradeData, DraftManagerGrade, DraftPickGrade } from "@/lib/draft-grades";
import { STANDINGS } from "./league";

// Mirrors GRADE_BANDS in draft-grades.ts (dynasty gradeUnit = 1000, redraft = 3).
const BANDS: [number, string][] = [[0.9, "A+"], [0.5, "A"], [0.25, "A-"], [0.12, "B+"], [0.04, "B"], [-0.04, "B-"], [-0.12, "C+"], [-0.25, "C"], [-0.5, "C-"], [-0.9, "D"]];
export const gradeFor = (perPick: number, unit = 1000) => BANDS.find(([floor]) => perPick / unit >= floor)?.[1] ?? "F";

// [player, position, NFL team, value today] in pick order.
const CLASS: [string, string, string, number][] = [
  ["Ashton Jeanty", "RB", "LV", 7420], ["Omarion Hampton", "RB", "LAC", 5980], ["Tetairoa McMillan", "WR", "CAR", 6210], ["Travis Hunter", "WR", "JAX", 3890],
  ["TreVeyon Henderson", "RB", "NE", 5140], ["Emeka Egbuka", "WR", "TB", 5620], ["Colston Loveland", "TE", "CHI", 3310], ["Cam Ward", "QB", "TEN", 3050],
  ["Tyler Warren", "TE", "IND", 4180], ["Matthew Golden", "WR", "GB", 2410], ["Quinshon Judkins", "RB", "CLE", 3560], ["Luther Burden III", "WR", "CHI", 2280],
  ["Kaleb Johnson", "RB", "PIT", 1210], ["RJ Harvey", "RB", "DEN", 2890], ["Tre Harris", "WR", "LAC", 1640], ["Jaxson Dart", "QB", "NYG", 2750],
  ["Cam Skattebo", "RB", "NYG", 3120], ["Jayden Higgins", "WR", "HOU", 1580], ["Kyle Williams", "WR", "NE", 690], ["Bhayshul Tuten", "RB", "JAX", 1330],
  ["Shedeur Sanders", "QB", "CLE", 540], ["Harold Fannin Jr.", "TE", "CLE", 1180], ["Jack Bech", "WR", "LV", 420], ["Tyler Shough", "QB", "NO", 910],
  ["Dylan Sampson", "RB", "CLE", 380], ["Elic Ayomanor", "WR", "TEN", 610], ["Mason Taylor", "TE", "NYJ", 720], ["Jaylin Noel", "WR", "HOU", 350],
  ["Pat Bryant", "WR", "DEN", 290], ["Trevor Etienne", "RB", "CAR", 180], ["Savion Williams", "WR", "GB", 240], ["Jalen Milroe", "QB", "SEA", 460],
  ["Jarquez Hunter", "RB", "LAR", 150], ["Ollie Gordon II", "RB", "MIA", 210], ["DJ Giddens", "RB", "IND", 170], ["Isaac TeSlaa", "WR", "DET", 330],
];

const slotValue = (pickNo: number) => Math.round(6900 * Math.exp(-0.1 * (pickNo - 1)) + 130);
const order = [...STANDINGS].reverse(); // worst record picks first
// A few slots changed hands before the draft: pickNo -> rosterId that used it.
const TRADED: Record<number, number> = { 3: 4, 9: 7, 17: 4, 26: 1 };

type BoardPick = DraftGradeData["allPicks"][number];
const byRoster = new Map(STANDINGS.map((row) => [row.rosterId, row]));

export const DRAFT_PICKS: BoardPick[] = CLASS.map(([player, position, team, value], index) => {
  const pickNo = index + 1;
  const round = Math.floor(index / 12) + 1;
  const original = order[index % 12];
  const owner = byRoster.get(TRADED[pickNo] ?? original.rosterId)!;
  const slot = slotValue(pickNo);
  const surplus = value - slot;
  const pick: DraftPickGrade = {
    id: `2025-${pickNo}`, pick: `${round}.${String((index % 12) + 1).padStart(2, "0")}`, pickNo, round, player,
    playerId: String(12500 + pickNo * 7), position, team, value, slotValue: slot, surplus, grade: gradeFor(surplus),
    acquiredFrom: TRADED[pickNo] ? original.name : null,
  };
  return { ...pick, rosterId: owner.rosterId, manager: owner.manager };
});

const managerGrade = (rosterId: number): DraftManagerGrade => {
  const team = byRoster.get(rosterId)!;
  const picks = DRAFT_PICKS.filter((pick) => pick.rosterId === rosterId);
  const surplus = picks.reduce((sum, pick) => sum + pick.surplus, 0);
  const perPick = picks.length ? Math.round(surplus / picks.length) : 0;
  const sorted = picks.toSorted((a, b) => b.surplus - a.surplus);
  return {
    rosterId, ownerId: `user-${rosterId}`, manager: team.manager, teamName: team.name, avatar: null,
    grade: gradeFor(perPick), hitRate: picks.length ? Math.round((picks.filter((pick) => pick.surplus >= 0).length / picks.length) * 100) : 0,
    surplus, surplusPerPick: perPick, spent: picks.reduce((sum, pick) => sum + pick.slotValue, 0), earned: picks.reduce((sum, pick) => sum + pick.value, 0),
    best: sorted[0] ?? null, worst: sorted.at(-1) ?? null, picks,
  };
};

export const DRAFT_MANAGERS = STANDINGS.map((row) => managerGrade(row.rosterId)).filter((manager) => manager.picks.length);

const positionRow = (position: string) => {
  const picks = DRAFT_PICKS.filter((pick) => pick.position === position);
  const surplus = picks.reduce((sum, pick) => sum + pick.surplus, 0);
  return { position, picks: picks.length, surplus, surplusPerPick: Math.round(surplus / picks.length), hitRate: Math.round((picks.filter((pick) => pick.surplus >= 0).length / picks.length) * 100) };
};

const roundRow = (round: number) => {
  const picks = DRAFT_PICKS.filter((pick) => pick.round === round);
  const surplus = picks.reduce((sum, pick) => sum + pick.surplus, 0);
  return { round, picks: picks.length, surplus, surplusPerPick: Math.round(surplus / picks.length) };
};

const SEASON_SWING: Record<string, number> = { "2023": -180, "2024": 240 };
const career: DraftCareerRow[] = DRAFT_MANAGERS.map((manager, index) => {
  const past = ["2023", "2024"].map((season) => {
    const perPick = Math.round(manager.surplusPerPick * 0.4 + SEASON_SWING[season] + ((index * 137) % 500) - 250);
    return { season, surplus: perPick * 3, surplusPerPick: perPick, picks: 3, grade: gradeFor(perPick) };
  });
  const bySeason = [...past, { season: "2025", surplus: manager.surplus, surplusPerPick: manager.surplusPerPick, picks: manager.picks.length, grade: manager.grade }];
  const picks = bySeason.reduce((sum, entry) => sum + entry.picks, 0);
  const surplus = bySeason.reduce((sum, entry) => sum + entry.surplus, 0);
  const perPick = Math.round(surplus / picks);
  return { rosterId: manager.rosterId, manager: manager.manager, teamName: manager.teamName, avatar: null, drafts: 3, picks, surplus, surplusPerPick: perPick, hitRate: Math.max(0, Math.min(100, manager.hitRate - 5 + (index % 3) * 8)), grade: gradeFor(perPick), bySeason };
}).toSorted((a, b) => b.surplusPerPick - a.surplusPerPick);

const board = DRAFT_PICKS.toSorted((a, b) => b.surplus - a.surplus);

export const DRAFT_DATA: DraftGradeData = {
  drafts: [
    { id: "d2025", label: "2025 Rookie Draft", season: "2025" },
    { id: "d2024", label: "2024 Rookie Draft", season: "2024" },
    { id: "d2023", label: "2023 Rookie Draft", season: "2023" },
  ],
  selectedDraftId: "d2025", selectedLabel: "2025 Rookie Draft", selectedSeason: "2025",
  rounds: 3, teams: 12, superflex: true, basis: "dynasty", curveBacked: true,
  managers: DRAFT_MANAGERS, allPicks: DRAFT_PICKS, steals: board.slice(0, 5), reaches: board.slice(-5).reverse(),
  byPosition: ["QB", "RB", "WR", "TE"].map(positionRow), byRound: [1, 2, 3].map(roundRow),
  career,
  classes: [
    { season: "2023", draftId: "d2023", totalSurplus: -2140, hitRate: 44, tradedPickShare: 0.18 },
    { season: "2024", draftId: "d2024", totalSurplus: 3310, hitRate: 56, tradedPickShare: 0.25 },
    { season: "2025", draftId: "d2025", totalSurplus: DRAFT_PICKS.reduce((sum, pick) => sum + pick.surplus, 0), hitRate: 50, tradedPickShare: 0.11 },
  ],
  attribution: { text: "Values by RosterAudit.com", url: "https://rosteraudit.com" },
};

// A redraft league's startup: values are points per game above replacement, graded on a 3-point unit.
const redraftPick = (pick: BoardPick): BoardPick => {
  const value = Math.round(pick.value / 180) / 10;
  const slot = Math.round(pick.slotValue / 180) / 10;
  const surplus = Math.round((value - slot) * 10) / 10;
  return { ...pick, value, slotValue: slot, surplus, grade: gradeFor(surplus, 3) };
};
const redraftPicks = DRAFT_PICKS.map(redraftPick);
const redraftManagers: DraftManagerGrade[] = DRAFT_MANAGERS.map((manager) => {
  const picks = redraftPicks.filter((pick) => pick.rosterId === manager.rosterId);
  const surplus = Math.round(picks.reduce((sum, pick) => sum + pick.surplus, 0) * 10) / 10;
  const perPick = Math.round((surplus / picks.length) * 10) / 10;
  const sorted = picks.toSorted((a, b) => b.surplus - a.surplus);
  return { ...manager, picks, surplus, surplusPerPick: perPick, grade: gradeFor(perPick, 3), spent: 0, earned: 0, best: sorted[0], worst: sorted.at(-1)! };
});

export const DRAFT_DATA_REDRAFT: DraftGradeData = {
  ...DRAFT_DATA,
  drafts: [{ id: "r2026", label: "2026 Draft", season: "2026" }], selectedDraftId: "r2026", selectedLabel: "2026 Draft", selectedSeason: "2026",
  basis: "redraft", superflex: false, curveBacked: false,
  managers: redraftManagers, allPicks: redraftPicks, steals: [], reaches: [], career: [], classes: [], attribution: null,
};

export const DRAFT_DATA_EMPTY: DraftGradeData = { ...DRAFT_DATA, drafts: [], selectedDraftId: null, managers: [], allPicks: [], steals: [], reaches: [], byPosition: [], byRound: [], career: [], classes: [] };
