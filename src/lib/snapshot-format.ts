// Shared by the app and `scripts/sleeper-snapshots.mjs`, which runs it under Node's type stripping,
// so this module must stay free of runtime imports and non-erasable TypeScript syntax.
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

/*
 * Snapshot layout in R2 (bucket `sleeper-fantasy-cache`):
 *
 *   snapshots/players/v1/latest.json             pointer: which version is current
 *   snapshots/players/v1/<version>/<shard>.json  one shard of the catalog
 *   snapshots/projections/v1/<season>/<week>.json one week's projections
 *
 * The catalog is split so a cold Worker isolate parses only what it needs: `active` holds the ~2,700
 * players on an NFL team (everything that is browsed, searched or suggested), `archive` the ~9,500
 * free agents and retired players that only appear as names on old rosters, drafts and trades.
 */
export const SNAPSHOT_SCHEMA = 1;
export const CATALOG_PREFIX = "snapshots/players/v1";
export const CATALOG_POINTER_KEY = `${CATALOG_PREFIX}/latest.json`;
export const PROJECTIONS_PREFIX = "snapshots/projections/v1";
export const CATALOG_SHARDS = ["active", "archive"] as const;
export type CatalogShard = (typeof CATALOG_SHARDS)[number];

export function catalogShardKey(version: string, shard: CatalogShard) {
  return `${CATALOG_PREFIX}/${version}/${shard}.json`;
}

export function projectionsKey(season: string, week: number) {
  return `${PROJECTIONS_PREFIX}/${season}/${week}.json`;
}

export function shardOf(player: NflPlayer): CatalogShard {
  return player.team ? "active" : "archive";
}

export type CatalogPointer = {
  schema: number;
  version: string;
  generatedAt: string;
  shards: Record<CatalogShard, { key: string; count: number; bytes: number }>;
};

// Rows are positional rather than keyed objects: the same data is about a third of the size and
// parses roughly twice as fast, which is what matters in a Worker's CPU budget.
const PLAYER_FIELDS = ["name", "position", "team", "age", "yearsExp", "injuryStatus", "injuryBodyPart", "practiceParticipation", "number", "espnId", "searchRank", "depthChartOrder", "status"] as const;
type PlayerRow = [string, ...unknown[]];
export type CatalogShardFile = { schema: number; fields: readonly string[]; rows: PlayerRow[] };

export function encodeCatalogShard(players: Iterable<NflPlayer>): CatalogShardFile {
  const rows: PlayerRow[] = [];
  for (const player of players) rows.push([player.id, ...PLAYER_FIELDS.map((field) => player[field])]);
  return { schema: SNAPSHOT_SCHEMA, fields: PLAYER_FIELDS, rows };
}

/** Adds one shard's players to `into`. Throws on a schema it does not understand rather than guessing. */
export function decodeCatalogShard(file: CatalogShardFile, into = new Map<string, NflPlayer>()): Map<string, NflPlayer> {
  if (file?.schema !== SNAPSHOT_SCHEMA || !Array.isArray(file.rows) || !Array.isArray(file.fields)) throw new Error("Unrecognized player snapshot shard");
  const { fields } = file;
  for (const row of file.rows) {
    const player = { id: row[0] } as Record<string, unknown>;
    for (let index = 0; index < fields.length; index++) player[fields[index]] = row[index + 1] ?? null;
    into.set(row[0], player as NflPlayer);
  }
  return into;
}

export type WeeklyProjection = { stats: Record<string, number>; opponent: string | null };
export type ProjectionRow = { player_id: string; stats?: Record<string, number> | null; opponent?: string | null };
export type ProjectionFile = { schema: number; season: string; week: number; generatedAt: string; players: Record<string, [Record<string, number>, string | null]> };

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

export function encodeProjections(season: string, week: number, projections: Map<string, WeeklyProjection>, generatedAt: string): ProjectionFile {
  const players: ProjectionFile["players"] = {};
  for (const [id, projection] of projections) players[id] = [projection.stats, projection.opponent];
  return { schema: SNAPSHOT_SCHEMA, season, week, generatedAt, players };
}

export function decodeProjections(file: ProjectionFile): Map<string, WeeklyProjection> {
  if (file?.schema !== SNAPSHOT_SCHEMA || typeof file.players !== "object" || file.players === null) throw new Error("Unrecognized projection snapshot");
  const projections = new Map<string, WeeklyProjection>();
  for (const id in file.players) {
    const [stats, opponent] = file.players[id];
    projections.set(id, { stats, opponent });
  }
  return projections;
}
