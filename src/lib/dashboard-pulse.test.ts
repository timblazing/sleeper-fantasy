import { describe, expect, it, vi } from "vitest";
import { getDashboardPulse, scoringWeek } from "@/lib/dashboard-pulse";
import { makeLeague, makeMatchup, makePlayer, makeRoster, makeSource, makeState } from "@/lib/test/fixtures";

const catalog = new Map([
  ["held", makePlayer({ id: "held" })],
  ["free", makePlayer({ id: "free", position: "RB" })],
  ["out", makePlayer({ id: "out", injuryStatus: "Out" })],
  ["retired", makePlayer({ id: "retired", status: "Inactive" })],
  ["kicker", makePlayer({ id: "kicker", position: "K" })],
  ["unsigned", makePlayer({ id: "unsigned", team: null })],
]);

describe("dashboard pulse", () => {
  it("ranks usable league free agents using league scoring rather than dynasty value", async () => {
    const result = await getDashboardPulse("L1", makeSource({
      getLeague: async () => makeLeague({ scoring_settings: { rec: 0.5, rush_yd: 0.1 } }),
      getLeagueRosters: async () => [makeRoster({ players: ["held"] })],
      getPlayerCatalog: async () => catalog,
      getWeeklyProjections: async () => new Map([...catalog.keys()].map(id => [id, { stats: { rec: 4, rush_yd: 60 }, opponent: "BUF" }])),
    }));
    expect(result.waiverBasis).toBe("weekly");
    expect(result.waivers.map(row => [row.player.id, row.score])).toEqual([["free", 8]]);
  });

  it("loads only six past weeks and retains gaps when a week fails", async () => {
    const getMatchups = vi.fn(async (_id: string, week: number) => {
      if (week === 8) throw new Error("upstream unavailable");
      return [makeMatchup({ points: 100 }), makeMatchup({ roster_id: 2, points: 0 })];
    });
    const result = await getDashboardPulse("L1", makeSource({ getNflState: async () => makeState({ week: 10 }), getMatchups }));
    expect(getMatchups.mock.calls.map(call => call[1])).toEqual([4, 5, 6, 7, 8, 9]);
    expect(result.scoring.map(row => row.week)).toEqual([4, 5, 6, 7, 9]);
    expect(result.scoring[0].scores[2]).toBe(0);
    expect(result.scoring[0].average).toBe(50);
  });

  it("avoids current-season scores and weekly projections for a past league", async () => {
    const getMatchups = vi.fn(async () => []);
    const getWeeklyProjections = vi.fn(async () => new Map());
    const result = await getDashboardPulse("L1", makeSource({ getNflState: async () => makeState({ season: "2026" }), getMatchups, getWeeklyProjections }));
    expect(result.scoring).toEqual([]);
    expect(getMatchups).not.toHaveBeenCalled();
    expect(getWeeklyProjections).not.toHaveBeenCalled();
  });

  it("falls back to clearly identified dynasty rankings when weekly projections fail", async () => {
    const result = await getDashboardPulse("L1", makeSource({
      getLeague: async () => makeLeague({ settings: { type: 2 } }),
      getPlayerCatalog: async () => catalog,
      getValues: async () => ({ ok: true, attribution: { text: "RosterAudit", url: "https://rosteraudit.com" }, data: { free: { sf: 200, "1qb": 100 }, held: { sf: 400, "1qb": 300 } } }),
      getLeagueRosters: async () => [makeRoster({ players: ["held"] })],
      getWeeklyProjections: async () => { throw new Error("down"); },
    }));
    expect(result.waiverBasis).toBe("dynasty");
    expect(result.waivers.map(row => [row.player.id, row.score])).toEqual([["free", 100]]);
  });
});

describe("scoringWeek", () => {
  it("does not turn empty, all-zero, or nonfinite upstream scores into observed weeks", () => {
    expect(scoringWeek(1, [])).toBeNull();
    expect(scoringWeek(1, [makeMatchup()])).toBeNull();
    expect(scoringWeek(1, [makeMatchup({ points: NaN })])).toBeNull();
  });
});

it("distinguishes unavailable catalog and rankings from a valid empty waiver list", async () => {
  const missingCatalog = await getDashboardPulse("L1", makeSource({ getPlayerCatalog: async () => { throw new Error("down"); } }));
  expect(missingCatalog.waiverReady).toBe(false);
  const missingValues = await getDashboardPulse("L1", makeSource({ getPlayerCatalog: async () => catalog }));
  expect(missingValues.waiverReady).toBe(false);
  const emptyWire = await getDashboardPulse("L1", makeSource({
    getPlayerCatalog: async () => catalog,
    getLeagueRosters: async () => [makeRoster({ players: [...catalog.keys()] })],
    getWeeklyProjections: async () => new Map([["free", { stats: { rec: 4 }, opponent: "BUF" }]]),
  }));
  expect(emptyWire.waiverReady).toBe(true);
  expect(emptyWire.waivers).toEqual([]);
});
