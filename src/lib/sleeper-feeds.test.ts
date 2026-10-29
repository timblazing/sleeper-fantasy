import { describe, expect, it } from "vitest";
import { type ProjectionRow, trimCatalog, trimProjections } from "@/lib/sleeper-feeds";

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

describe("trimProjections", () => {
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
});
