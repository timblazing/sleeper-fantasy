import { describe, expect, it } from "vitest";
import { liveForecast, liveWinProbability, projectedWinProbability, scoreProjection } from "@/lib/projections";

describe("scoreProjection", () => {
  it("uses the league scoring multipliers", () => {
    expect(scoreProjection({ pass_yd: 250, pass_td: 2, pass_int: 1 }, { pass_yd: 0.04, pass_td: 4, pass_int: -2 })).toBe(16);
  });

  it("returns null when the player has no projection", () => {
    expect(scoreProjection(undefined, { rec: 1 })).toBeNull();
  });
});

describe("projectedWinProbability", () => {
  it("is even for equal projections", () => {
    expect(projectedWinProbability(125, 125)).toBe(50);
  });

  it("returns complementary matchup odds", () => {
    const home = projectedWinProbability(145, 115);
    const away = projectedWinProbability(115, 145);
    expect(home).toBeGreaterThan(50);
    expect(home + away).toBe(100);
  });
});

const slot = (points: number | null, projection: number | null, state: "pre" | "in" | "post" | null) => ({ points, projection, state });

describe("liveForecast", () => {
  it("returns null when no starter has a score or a projection", () => {
    expect(liveForecast([slot(null, null, "pre")])).toBeNull();
  });

  it("counts a finished game as settled points with no variance", () => {
    expect(liveForecast([slot(22.4, 15, "post")])).toEqual({ mean: 22.4, deviation: 0 });
  });

  it("counts an unstarted game as its full projection, carrying variance", () => {
    const forecast = liveForecast([slot(0, 14, "pre")])!;
    expect(forecast.mean).toBe(14);
    expect(forecast.deviation).toBeGreaterThan(0);
  });

  it("splits a mid-game starter between points banked and projection left", () => {
    const forecast = liveForecast([slot(6, 14, "in")])!;
    expect(forecast.mean).toBe(13);
    expect(forecast.deviation).toBeCloseTo(2.45, 1);
  });

  it("uses the remaining clock instead of adding half a projection near the final whistle", () => {
    const early = liveForecast([{ ...slot(10, 20, "in"), period: 1, clockSeconds: 600 }])!;
    const late = liveForecast([{ ...slot(10, 20, "in"), period: 4, clockSeconds: 60 }])!;
    expect(early.mean).toBeCloseTo(10 + 20 * 3300 / 3600);
    expect(late.mean).toBeCloseTo(10 + 20 / 60);
    expect(late.deviation).toBeLessThan(early.deviation);
  });

  it("handles halftime, overtime, and invalid clocks", () => {
    expect(liveForecast([{ ...slot(10, 20, "in"), period: 2, clockSeconds: 0 }])!.mean).toBe(20);
    expect(liveForecast([{ ...slot(10, 20, "in"), period: 5, clockSeconds: 600 }])!.mean).toBeCloseTo(10 + 20 / 6);
    expect(liveForecast([{ ...slot(10, 20, "in"), period: 4, clockSeconds: NaN }])!.mean).toBe(20);
    expect(liveForecast([{ ...slot(10, 20, "in"), period: 4, clockSeconds: 0 }])!.deviation).toBeGreaterThan(0);
    expect(liveForecast([{ ...slot(10, 20, "post"), period: 4, clockSeconds: 0 }])!.deviation).toBe(0);
  });

  it("never lets a hot start subtract from the forecast", () => {
    // A negative projection would otherwise pull the mean below what the player already scored.
    expect(liveForecast([slot(30, -10, "in")])!.mean).toBe(30);
  });
});

describe("liveWinProbability", () => {
  it("is decisive once every starter is final", () => {
    const home = liveForecast([slot(137.9, 133, "post")])!;
    const away = liveForecast([slot(80.8, 131.7, "post")])!;
    expect(liveWinProbability(home, away)).toBe(100);
    expect(liveWinProbability(away, home)).toBe(0);
  });

  it("is even when two settled scores tie", () => {
    const tied = liveForecast([slot(100, 100, "post")])!;
    expect(liveWinProbability(tied, tied)).toBe(50);
  });

  it("still reflects the projection edge before kickoff", () => {
    const home = liveForecast([slot(0, 133, "pre")])!;
    const away = liveForecast([slot(0, 131.7, "pre")])!;
    expect(liveWinProbability(home, away)).toBeGreaterThan(50);
    expect(liveWinProbability(home, away)).toBeLessThan(60);
  });

  it("tightens as the week resolves, for the same scoreline", () => {
    const leadEarly = liveWinProbability(liveForecast([slot(90, 90, "post"), slot(0, 30, "pre")])!, liveForecast([slot(70, 90, "post"), slot(0, 30, "pre")])!);
    const leadFinal = liveWinProbability(liveForecast([slot(90, 90, "post"), slot(30, 30, "post")])!, liveForecast([slot(70, 90, "post"), slot(30, 30, "post")])!);
    expect(leadFinal).toBeGreaterThan(leadEarly);
  });
});
