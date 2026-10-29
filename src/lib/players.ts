import "server-only";
import { REQUEST_TIMEOUT_MS } from "@/lib/fetch-cached";
import { createMemo } from "@/lib/memo";
import {
  CATALOG_POINTER_KEY, CATALOG_SHARDS, type CatalogPointer, type CatalogShardFile, decodeCatalogShard, defensePlayer, isDefenseId,
  NFL_TEAMS, type RawPlayer, SNAPSHOT_SCHEMA, trimCatalog,
} from "@/lib/snapshot-format";
import { getSnapshotBucket, readSnapshot, type SnapshotBucket } from "@/lib/snapshot-store";
import type { NflPlayer } from "@/lib/types";

const API = "https://api.sleeper.app/v1";
// Sleeper asks that the full player map be fetched no more than once per day. It is ~15MB of JSON,
// which is far past Next's data-cache entry limit, so it is trimmed and held in module memory here
// rather than going through fetchCached.
const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;
// On Workers the daily refresh is done by a GitHub Actions job that writes a snapshot to R2, so an
// isolate only checks the one-line pointer hourly and re-reads the shards when the version moves.
const SNAPSHOT_RECHECK_MS = 60 * 60 * 1000;

export { isDefenseId, NFL_TEAMS };

async function fetchCatalog(): Promise<Map<string, NflPlayer>> {
  const response = await fetch(`${API}/players/nfl`, { cache: "no-store", headers: { "User-Agent": "Sleeper Fantasy/0.1" }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Sleeper player map returned ${response.status}`);
  return trimCatalog((await response.json()) as Record<string, RawPlayer>);
}

let snapshot: { version: string; players: Map<string, NflPlayer> } | null = null;

/**
 * Reads the catalog from the R2 snapshot. There is deliberately no fallback to Sleeper's 15MB feed
 * here: parsing it would blow a Worker's CPU budget and fail the whole page, whereas a thrown error
 * leaves callers with the last good catalog or, on a brand-new isolate, placeholder names.
 */
export async function readCatalogSnapshot(bucket: SnapshotBucket): Promise<Map<string, NflPlayer>> {
  const pointer = await readSnapshot<CatalogPointer>(bucket, CATALOG_POINTER_KEY);
  if (!pointer || pointer.schema !== SNAPSHOT_SCHEMA) throw new Error("No usable player snapshot in R2");
  if (snapshot?.version === pointer.version) return snapshot.players;
  const files = await Promise.all(CATALOG_SHARDS.map(async (shard) => {
    const file = await readSnapshot<CatalogShardFile>(bucket, pointer.shards[shard].key);
    if (!file) throw new Error(`Player snapshot ${pointer.version} is missing its ${shard} shard`);
    return file;
  }));
  const players = new Map<string, NflPlayer>();
  for (const file of files) decodeCatalogShard(file, players);
  snapshot = { version: pointer.version, players };
  return players;
}

function loadCatalog(): Promise<Map<string, NflPlayer>> {
  const bucket = getSnapshotBucket();
  return bucket ? readCatalogSnapshot(bucket) : fetchCatalog();
}

// A second request arriving during the load awaits the same read; a stale catalog beats no names at
// all when Sleeper or R2 is briefly unavailable, and with no catalog at all the read must fail.
const catalogMemo = createMemo({
  load: loadCatalog,
  ttlMs: () => (getSnapshotBucket() ? SNAPSHOT_RECHECK_MS : CATALOG_TTL_MS),
  onError: "throw",
});

/** The full Sleeper player map, trimmed to the fields the dashboard renders and refreshed daily. */
export function getPlayerCatalog(): Promise<Map<string, NflPlayer>> {
  return catalogMemo.get("nfl");
}

/** Test hook — drops the memo and the remembered snapshot version. */
export function resetPlayerCatalog() {
  catalogMemo.reset();
  snapshot = null;
}

/** Always returns something renderable: unknown ids become a placeholder rather than a blank row. */
export function resolvePlayer(catalog: Map<string, NflPlayer>, id: string): NflPlayer {
  return catalog.get(id) ?? (isDefenseId(id) ? defensePlayer(id) : { id, name: `Player ${id}`, position: null, team: null, age: null, yearsExp: null, injuryStatus: null, injuryBodyPart: null, practiceParticipation: null, number: null, espnId: null, searchRank: null, depthChartOrder: null, status: null });
}

