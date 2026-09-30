// Team-page fixtures: two rosters from the shared 12-team dynasty league, valued at RosterAudit scale.
import type { LeagueTeam, PositionRoom, ValuedPlayer } from "@/lib/league-values";
import { player } from "./league";

const vp = (id: string, name: string, position: string, team: string, age: number, value: number, rankPosition: number, rosterId: number, owner: string): ValuedPlayer => ({
  player: player(id, name, position, team, { age }), value, rankOverall: null, rankPosition, ownerRosterId: rosterId, ownerName: owner,
});

const room = (position: string, value: number, players: number, avgAge: number | null, rank: number, leagueAvg: number): PositionRoom => ({ position, value, players, avgAge, rank, leagueAvg });

const F = (id: string, name: string, pos: string, team: string, age: number, value: number, rank: number) => vp(id, name, pos, team, age, value, rank, 4, "Fourth & Long");

const FOURTH_ROSTER: ValuedPlayer[] = [
  F("4984", "Josh Allen", "QB", "BUF", 30.3, 10000, 1), F("9493", "Puka Nacua", "WR", "LAR", 25.3, 9410, 2), F("6794", "Justin Jefferson", "WR", "MIN", 27.3, 8988, 4),
  F("11604", "Brock Bowers", "TE", "LV", 23.9, 7954, 1), F("8155", "Breece Hall", "RB", "NYJ", 25.1, 6420, 9), F("9509", "Bijan Robinson", "RB", "ATL", 24.6, 9820, 1),
  F("8146", "Garrett Wilson", "WR", "NYJ", 26.1, 6105, 14), F("4881", "Lamar Jackson", "QB", "BAL", 29.7, 8120, 4), F("8150", "Kenneth Walker III", "RB", "SEA", 25.0, 3940, 21),
  F("9997", "Zay Flowers", "WR", "BAL", 25.1, 4210, 29), F("12527", "Luther Burden III", "WR", "CHI", 22.1, 2280, 48), F("12522", "Colston Loveland", "TE", "CHI", 21.5, 3310, 8),
  F("8171", "Tank Bigsby", "RB", "PHI", 25.0, 980, 55),
];

export const TEAM_CONTENDER: LeagueTeam = {
  rosterId: 4, ownerId: "user-4", name: "Fourth & Long", manager: "clayb", avatar: null,
  wins: 3, losses: 0, ties: 0, pointsFor: 412.6, pointsAgainst: 353.2, value: FOURTH_ROSTER.reduce((s, e) => s + e.value, 0), valueRank: 1, powerRank: 1,
  rooms: [room("QB", 18120, 2, 30.0, 1, 11840), room("RB", 21160, 4, 24.9, 2, 16420), room("WR", 31003, 5, 25.2, 1, 22310), room("TE", 11264, 2, 22.7, 1, 6120)],
  roster: FOURTH_ROSTER,
  starters: ["4984", "4881", "9509", "8155", "9493", "6794", "8146", "11604"],
  taxi: ["12527", "12522"], reserve: ["8171"], players: FOURTH_ROSTER.map((e) => e.player.id),
};

const T = (id: string, name: string, pos: string, team: string, age: number, value: number, rank: number) => vp(id, name, pos, team, age, value, rank, 6, "Tank Commander");

const TANK_ROSTER: ValuedPlayer[] = [
  T("4046", "Patrick Mahomes", "QB", "KC", 31.0, 6010, 9), T("2216", "Mike Evans", "WR", "TB", 33.1, 2140, 41), T("4035", "Alvin Kamara", "RB", "NO", 31.2, 1320, 38),
  T("5859", "A.J. Brown", "WR", "PHI", 29.3, 5480, 18), T("5872", "Deebo Samuel", "WR", "WAS", 29.7, 1810, 52), T("5844", "T.J. Hockenson", "TE", "MIN", 28.4, 2350, 14),
  T("4199", "Aaron Jones", "RB", "MIN", 31.8, 690, 61), T("12507", "Omarion Hampton", "RB", "LAC", 22.4, 5980, 12),
];

export const TEAM_REBUILDER: LeagueTeam = {
  rosterId: 6, ownerId: "user-6", name: "Tank Commander", manager: "alexr", avatar: null,
  wins: 0, losses: 3, ties: 0, pointsFor: 301.9, pointsAgainst: 363.4, value: TANK_ROSTER.reduce((s, e) => s + e.value, 0), valueRank: 12, powerRank: 11,
  rooms: [room("QB", 6010, 1, 31.0, 9, 11840), room("RB", 7990, 3, 28.5, 11, 16420), room("WR", 9430, 3, 30.7, 12, 22310), room("TE", 2350, 1, 28.4, 7, 6120)],
  roster: TANK_ROSTER,
  starters: ["4046", "12507", "4035", "5859", "2216", "5872", "5844"], taxi: [], reserve: [], players: TANK_ROSTER.map((e) => e.player.id),
};
