import { describe, expect, it } from "vitest";
import { FINISHED_SEASON_TTL, SETTLED_WEEK_TTL, settledTtl } from "@/lib/sleeper";

const state = { season: "2026", week: 8 };

describe("settledTtl", () => {
  it("caches every read of an earlier season for the long window", () => {
    expect(settledTtl({ season: "2025", status: "in_season" }, state, 12)).toBe(FINISHED_SEASON_TTL);
    expect(settledTtl({ season: "2025", status: "complete" }, state)).toBe(FINISHED_SEASON_TTL);
  });

  it("treats a completed current-season league as finished", () => {
    expect(settledTtl({ season: "2026", status: "complete" }, state, 17)).toBe(FINISHED_SEASON_TTL);
  });

  it("caches weeks behind the current one for an hour", () => {
    expect(settledTtl({ season: "2026", status: "in_season" }, state, 7)).toBe(SETTLED_WEEK_TTL);
  });

  it("keeps the current week, later weeks and season-level reads live", () => {
    const league = { season: "2026", status: "in_season" };
    expect(settledTtl(league, state, 8)).toBe("live");
    expect(settledTtl(league, state, 9)).toBe("live");
    expect(settledTtl(league, state)).toBe("live");
    expect(settledTtl(league, { season: "2026", week: null }, 3)).toBe("live");
  });
});
