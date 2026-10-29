import "server-only";
import { REQUEST_TIMEOUT_MS } from "@/lib/fetch-cached";
import { createMemo } from "@/lib/memo";
import { defensePlayer, isDefenseId, NFL_TEAMS, type RawPlayer, trimCatalog } from "@/lib/sleeper-feeds";
import type { NflPlayer } from "@/lib/types";

const API = "https://api.sleeper.app/v1";
// Sleeper asks that the full player map be fetched no more than once per day. It is ~15MB of JSON,
// which is far past Next's data-cache entry limit, so it is trimmed and held in module memory here
// rather than going through fetchCached.
const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;

export { isDefenseId, NFL_TEAMS };

async function loadCatalog(): Promise<Map<string, NflPlayer>> {
  const response = await fetch(`${API}/players/nfl`, { cache: "no-store", headers: { "User-Agent": "Sleeper Fantasy/0.1" }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Sleeper player map returned ${response.status}`);
  return trimCatalog((await response.json()) as Record<string, RawPlayer>);
}

// A second request arriving during the ~2s load awaits the same fetch; a stale catalog beats no
// names at all when Sleeper is briefly unavailable, and with no catalog at all the read must fail.
const catalogMemo = createMemo({ load: loadCatalog, ttlMs: CATALOG_TTL_MS, onError: "throw" });

/** The full Sleeper player map, trimmed to the fields the dashboard renders and refreshed daily. */
export function getPlayerCatalog(): Promise<Map<string, NflPlayer>> {
  return catalogMemo.get("nfl");
}

/** Test hook — drops the memoized catalog. */
export function resetPlayerCatalog() {
  catalogMemo.reset();
}

/** Always returns something renderable: unknown ids become a placeholder rather than a blank row. */
export function resolvePlayer(catalog: Map<string, NflPlayer>, id: string): NflPlayer {
  return catalog.get(id) ?? (isDefenseId(id) ? defensePlayer(id) : { id, name: `Player ${id}`, position: null, team: null, age: null, yearsExp: null, injuryStatus: null, injuryBodyPart: null, practiceParticipation: null, number: null, espnId: null, searchRank: null, depthChartOrder: null, status: null });
}

