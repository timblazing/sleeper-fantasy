import { describe, expect, it } from "vitest";
import {
  catalogShardKey, decodeCatalogShard, type ProjectionRow, decodeProjections, encodeCatalogShard, encodeProjections, projectionsKey, shardOf, trimCatalog,
  trimProjections,
} from "@/lib/snapshot-format";

const raw = {
  "4046": { full_name: "Patrick Mahomes", position: "QB", team: "KC", age: 31, years_exp: 9, injury_status: null, espn_id: 3139477, search_rank: 12, depth_chart_order: 1, status: "Active", number: 15 },
  "1234": { first_name: "Old", last_name: "Timer", fantasy_positions: ["WR"], team: null, status: "Inactive" },
  "9999": { position: "RB", team: "DAL" },
  KC: { team: "KC", position: "DEF" },
};

describe("trimCatalog", () => {
  it("keeps the rendered fields, builds names, synthesizes defenses and drops nameless rows", () => {
    const players = trimCatalog(raw);
    expect([...players.keys()].sort()).toEqual(["1234", "4046", "KC"]);
    expect(players.get("4046")).toMatchObject({ id: "4046", name: "Patrick Mahomes", position: "QB", team: "KC", espnId: 3139477, yearsExp: 9, injuryStatus: null });
    expect(players.get("1234")).toMatchObject({ name: "Old Timer", position: "WR", team: null, age: null });
    expect(players.get("KC")).toMatchObject({ name: "Chiefs D/ST", position: "DEF", team: "KC" });
  });
});

describe("catalog shards", () => {
  it("puts rostered NFL players in the active shard and everyone else in the archive", () => {
    const players = trimCatalog(raw);
    expect(shardOf(players.get("4046")!)).toBe("active");
    expect(shardOf(players.get("KC")!)).toBe("active");
    expect(shardOf(players.get("1234")!)).toBe("archive");
    expect(catalogShardKey("v1", "active")).toBe("snapshots/players/v1/v1/active.json");
  });

  it("round-trips every player exactly through JSON", () => {
    const players = trimCatalog(raw);
    const file = JSON.parse(JSON.stringify(encodeCatalogShard(players.values())));
    expect(decodeCatalogShard(file)).toEqual(players);
  });

  it("merges several shards into one map", () => {
    const players = trimCatalog(raw);
    const active = [...players.values()].filter((player) => shardOf(player) === "active");
    const archive = [...players.values()].filter((player) => shardOf(player) === "archive");
    const merged = decodeCatalogShard(encodeCatalogShard(archive), decodeCatalogShard(encodeCatalogShard(active)));
    expect(merged).toEqual(players);
  });

  it("rejects a shard written with another schema", () => {
    expect(() => decodeCatalogShard({ schema: 2, fields: [], rows: [] })).toThrow(/Unrecognized/);
  });
});

describe("projection snapshots", () => {
  const rows: ProjectionRow[] = [
    { player_id: "4046", stats: { pass_yd: 275.5, pass_td: 2, rush_yd: 0, adp_dd_ppr: 30, pos_adp_dd_ppr: 4, pts_ppr: 22, pts_allow_0: 0 }, opponent: "LV" },
    { player_id: "KC", stats: { pts_allow_14_20: 0.4, adp_dd_ppr: 999 }, opponent: "LV" },
    { player_id: "1234", stats: { adp_dd_ppr: 999 } },
    { player_id: "5555", stats: null },
  ];

  it("drops zero and non-scoring stats but keeps defensive points-allowed buckets", () => {
    const projections = trimProjections(rows);
    expect([...projections.keys()]).toEqual(["4046", "KC"]);
    expect(projections.get("4046")).toEqual({ stats: { pass_yd: 275.5, pass_td: 2 }, opponent: "LV" });
    expect(projections.get("KC")).toEqual({ stats: { pts_allow_14_20: 0.4 }, opponent: "LV" });
  });

  it("round-trips through the snapshot file", () => {
    const projections = trimProjections(rows);
    const file = JSON.parse(JSON.stringify(encodeProjections("2026", 9, projections, "2026-10-29T00:00:00.000Z")));
    expect(decodeProjections(file)).toEqual(projections);
    expect(projectionsKey("2026", 9)).toBe("snapshots/projections/v1/2026/9.json");
  });
});
