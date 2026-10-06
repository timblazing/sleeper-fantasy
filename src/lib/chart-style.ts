/** Shared chart presentation. Categorical --series-* colors belong to multi-series charts. */
export const SINGLE_SERIES_COLOR = "var(--chart-1)";
export const CHART_AXIS = {
  axisLine: false,
  tickLine: false,
  tickMargin: 8,
  tick: { fontSize: 12, fill: "var(--muted-foreground)" },
} as const;
export const CHART_GRID = { vertical: false, stroke: "var(--border)", strokeOpacity: 0.6 } as const;

/** Keep unknown observations as gaps; a measured zero is a real observation. */
export function chartValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function formatChartNumber(value: unknown, options: Intl.NumberFormatOptions = {}): string {
  const number = chartValue(value);
  return number == null ? "—" : number.toLocaleString("en-US", { maximumFractionDigits: 2, ...options });
}

export function summarizeChartValues(values: readonly unknown[]) {
  const observed = values.map(chartValue).filter((value): value is number => value != null);
  if (!observed.length) return null;
  return {
    count: observed.length,
    first: observed[0],
    last: observed[observed.length - 1],
    average: observed.reduce((sum, value) => sum + value, 0) / observed.length,
    min: Math.min(...observed),
    max: Math.max(...observed),
  };
}
