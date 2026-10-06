import { describe, expect, it } from "vitest";
import { chartValue, formatChartNumber, summarizeChartValues } from "./chart-style";

describe("chart observations", () => {
  it("preserves measured zeros and negative scores while ignoring unavailable values", () => {
    expect(summarizeChartValues([null, 0, 6, undefined, -3, NaN, Infinity])).toEqual({
      count: 3, first: 0, last: -3, average: 1, min: -3, max: 6,
    });
    expect(chartValue(0)).toBe(0);
    expect(chartValue("0")).toBeNull();
  });

  it("does not invent a score when all observations are missing", () => {
    expect(summarizeChartValues([null, undefined, NaN])).toBeNull();
  });

  it("formats unavailable values distinctly from a measured zero", () => {
    expect(formatChartNumber(null)).toBe("—");
    expect(formatChartNumber(NaN)).toBe("—");
    expect(formatChartNumber(0, { minimumFractionDigits: 1 })).toBe("0.0");
    expect(formatChartNumber(9140)).toBe("9,140");
  });
});
