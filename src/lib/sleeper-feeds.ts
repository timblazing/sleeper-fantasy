// Trims Sleeper's two large feeds, the player map and weekly projections, to what the app reads.
import type { NflPlayer } from "@/lib/types";

export const NFL_TEAMS: Record<string, string> = {
  ARI: "Cardinals", ATL: "Falcons", BAL: "Ravens", BUF: "Bills", CAR: "Panthers", CHI: "Bears", CIN: "Bengals", CLE: "Browns",
  DAL: "Cowboys", DEN: "Broncos", DET: "Lions", GB: "Packers", HOU: "Texans", IND: "Colts", JAX: "Jaguars", KC: "Chiefs",
  LAC: "Chargers", LAR: "Rams", LV: "Raiders", MIA: "Dolphins", MIN: "Vikings", NE: "Patriots", NO: "Saints", NYG: "Giants",
  NYJ: "Jets", PHI: "Eagles", PIT: "Steelers", SEA: "Seahawks", SF: "49ers", TB: "Buccaneers", TEN: "Titans", WAS: "Commanders",
};

export type RawPlayer = {
  full_name?: string; first_name?: string; last_name?: string; position?: string; fantasy_positions?: string[] | null;
  team?: string | null; status?: string | null; injury_status?: string | null; injury_body_part?: string | null;
  practice_participation?: string | null; number?: number | null;
  age?: number | null; years_exp?: number | null; espn_id?: number | null; search_rank?: number | null;
  depth_chart_position?: string | null; depth_chart_order?: number | null; active?: boolean;
};

export function isDefenseId(playerId: string) {
  return /^[A-Z]{2,4}$/.test(playerId);
}

export function defensePlayer(id: string): NflPlayer {
  return { id, name: `${NFL_TEAMS[id] ?? id} D/ST`, position: "DEF", team: id, age: null, yearsExp: null, injuryStatus: null, injuryBodyPart: null, practiceParticipation: null, number: null, espnId: null, searchRank: null, depthChartOrder: null, status: null };
}

export function trimPlayer(id: string, raw: RawPlayer): NflPlayer | null {
  if (isDefenseId(id)) return defensePlayer(id);
  const name = raw.full_name || [raw.first_name, raw.last_name].filter(Boolean).join(" ");
  if (!name) return null;
  const position = raw.position ?? raw.fantasy_positions?.[0] ?? null;
  return {
    id, name, position, team: raw.team ?? null, age: raw.age ?? null, yearsExp: raw.years_exp ?? null,
    injuryStatus: raw.injury_status ?? null, injuryBodyPart: raw.injury_body_part ?? null,
    practiceParticipation: raw.practice_participation ?? null, number: raw.number ?? null, espnId: raw.espn_id ?? null,
    searchRank: raw.search_rank ?? null, depthChartOrder: raw.depth_chart_order ?? null, status: raw.status ?? null,
  };
}

/** Sleeper's `/players/nfl` map, trimmed to the fields the dashboard renders. */
export function trimCatalog(raw: Record<string, RawPlayer>): Map<string, NflPlayer> {
  const players = new Map<string, NflPlayer>();
  for (const [id, entry] of Object.entries(raw)) {
    const player = trimPlayer(id, entry);
    if (player) players.set(id, player);
  }
  return players;
}

export type WeeklyProjection = { stats: Record<string, number>; opponent: string | null };
export type ProjectionRow = { player_id: string; stats?: Record<string, number> | null; opponent?: string | null };

// Draft-position and precomputed-total fields ride along on every row but are never league scoring
// categories (`pts_allow_*`, which is one, is deliberately not matched). They are most of the feed.
const NON_SCORING_STAT = /^(adp_|pos_adp_)|^pts_(ppr|half_ppr|std)$/;

/**
 * Sleeper's weekly projection feed, reduced to what `scoreProjection` reads. Zero and non-scoring
 * stats are dropped: scoring treats a missing stat as zero, so this is lossless for every league and
 * cuts the ~5.8MB feed to about 250KB.
 */
export function trimProjections(rows: ProjectionRow[]): Map<string, WeeklyProjection> {
  const projections = new Map<string, WeeklyProjection>();
  for (const row of rows) {
    if (!row.stats) continue;
    const stats: Record<string, number> = {};
    let any = false;
    for (const [key, value] of Object.entries(row.stats)) {
      if (typeof value === "number" && value !== 0 && Number.isFinite(value) && !NON_SCORING_STAT.test(key)) { stats[key] = value; any = true; }
    }
    if (any) projections.set(row.player_id, { stats, opponent: row.opponent ?? null });
  }
  return projections;
}
