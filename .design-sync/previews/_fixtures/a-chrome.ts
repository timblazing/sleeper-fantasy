// Batch A fixtures: league chrome (sidebar/header identity) for the shell previews.
import type { LeagueChrome } from "@/lib/league-chrome";
import { LEAGUE_ID } from "./league";

export const LEAGUE_CHROME: LeagueChrome = {
  id: LEAGUE_ID, name: "Gridiron Legends Dynasty", season: "2026", type: "Dynasty", isDynasty: true,
  basis: "dynasty", isSuperflex: true, matchupWeek: 4, avatar: null,
};

export const REDRAFT_CHROME: LeagueChrome = {
  id: "1182093341557391360", name: "Office Pickem Redraft", season: "2026", type: "Redraft", isDynasty: false,
  basis: "redraft", isSuperflex: false, matchupWeek: 4, avatar: null,
};
