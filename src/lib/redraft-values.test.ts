import { describe, expect, it } from "vitest";
import { toProjectedPpg } from "@/lib/redraft-values";

describe("raw projected PPG", () => {
  it("preserves projected scoring without a positional subtraction", () => {
    const values = toProjectedPpg([
      { sleeperId: "qb", position: "QB", ppg: 24.75 },
      { sleeperId: "rb", position: "RB", ppg: 18.25 },
      { sleeperId: "te", position: "TE", ppg: 10 },
      { sleeperId: "zero", position: "WR", ppg: 0 },
    ]);
    expect([...values.values()]).toEqual([24.8, 18.3, 10, 0]);
  });
  it("keeps missing data unavailable and accepts supplied K/DEF projections", () => {
    const values = toProjectedPpg([{ sleeperId: "k", position: "K", ppg: 9 }, { sleeperId: "def", position: "DEF", ppg: 8 }, { sleeperId: "bad", position: "TE", ppg: NaN }]);
    expect(values.get("k")).toBe(9);
    expect(values.get("def")).toBe(8);
    expect(values.has("bad")).toBe(false);
    expect(values.has("missing")).toBe(false);
  });
});
