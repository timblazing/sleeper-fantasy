import { afterEach, describe, expect, it, vi } from "vitest";
import { getPlayerCatalog, readCatalogSnapshot, resetPlayerCatalog } from "@/lib/players";
import { CATALOG_POINTER_KEY, catalogShardKey, encodeCatalogShard, type CatalogShard, SNAPSHOT_SCHEMA, trimCatalog } from "@/lib/snapshot-format";
import type { SnapshotBucket } from "@/lib/snapshot-store";

const CONTEXT = Symbol.for("__cloudflare-context__");
const players = trimCatalog({
  "4046": { full_name: "Patrick Mahomes", position: "QB", team: "KC" },
  "1234": { full_name: "Old Timer", position: "WR", team: null },
});

function bucketWith(version: string, objects: Partial<Record<CatalogShard, unknown>> = {}) {
  const store = new Map<string, unknown>([
    [catalogShardKey(version, "active"), objects.active ?? encodeCatalogShard([players.get("4046")!])],
    [catalogShardKey(version, "archive"), objects.archive ?? encodeCatalogShard([players.get("1234")!])],
    [CATALOG_POINTER_KEY, {
      schema: SNAPSHOT_SCHEMA, version, generatedAt: "2026-10-29T00:00:00.000Z",
      shards: { active: { key: catalogShardKey(version, "active"), count: 1, bytes: 1 }, archive: { key: catalogShardKey(version, "archive"), count: 1, bytes: 1 } },
    }],
  ]);
  const get = vi.fn(async (key: string) => (store.has(key) ? { json: async <T>() => structuredClone(store.get(key)) as T } : null));
  return { bucket: { get } satisfies SnapshotBucket, store, get };
}

afterEach(() => {
  resetPlayerCatalog();
  delete (globalThis as Record<symbol, unknown>)[CONTEXT];
  vi.unstubAllGlobals();
});

describe("readCatalogSnapshot", () => {
  it("merges every shard named by the latest pointer", async () => {
    const { bucket } = bucketWith("v1");
    expect(await readCatalogSnapshot(bucket)).toEqual(players);
  });

  it("re-reads only the pointer while the version is unchanged", async () => {
    const { bucket, get } = bucketWith("v1");
    const first = await readCatalogSnapshot(bucket);
    get.mockClear();
    expect(await readCatalogSnapshot(bucket)).toBe(first);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(CATALOG_POINTER_KEY);
  });

  it("fails when the pointer or a shard is missing", async () => {
    const empty: SnapshotBucket = { get: async () => null };
    await expect(readCatalogSnapshot(empty)).rejects.toThrow(/No usable player snapshot/);
    const { bucket, store } = bucketWith("v2");
    store.delete(catalogShardKey("v2", "archive"));
    await expect(readCatalogSnapshot(bucket)).rejects.toThrow(/missing its archive shard/);
  });
});

describe("getPlayerCatalog", () => {
  it("reads the R2 snapshot on Workers and never fetches Sleeper", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { bucket } = bucketWith("v1");
    (globalThis as Record<symbol, unknown>)[CONTEXT] = { env: { SNAPSHOTS: bucket } };
    expect(await getPlayerCatalog()).toEqual(players);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls back to Sleeper's feed under Node, where there is no binding", async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ "4046": { full_name: "Patrick Mahomes", position: "QB", team: "KC" } })));
    vi.stubGlobal("fetch", fetchSpy);
    const catalog = await getPlayerCatalog();
    expect(fetchSpy).toHaveBeenCalledWith("https://api.sleeper.app/v1/players/nfl", expect.anything());
    expect(catalog.get("4046")?.name).toBe("Patrick Mahomes");
  });

  it("keeps the last good catalog when a later snapshot read fails", async () => {
    vi.useFakeTimers();
    try {
      const { bucket, get } = bucketWith("v1");
      (globalThis as Record<symbol, unknown>)[CONTEXT] = { env: { SNAPSHOTS: bucket } };
      const first = await getPlayerCatalog();
      get.mockRejectedValue(new Error("R2 unavailable"));
      vi.advanceTimersByTime(2 * 60 * 60 * 1000);
      expect(await getPlayerCatalog()).toBe(first);
    } finally {
      vi.useRealTimers();
    }
  });
});
