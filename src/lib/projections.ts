import "server-only";
import { createMemo } from "@/lib/memo";

type SleeperProjection = {
  player_id: string;
  stats?: Record<string, number> | null;
  opponent?: string | null;
};

export type WeeklyProjection = { stats: Record<string, number>; opponent: string | null };

const API = "https://api.sleeper.com";
const CACHE_TTL_MS = 30 * 60 * 1000;

/** The memo is keyed by `${season}:${week}`, which this parses back into the two request parameters. */
async function loadWeeklyProjections(key: string): Promise<Map<string, WeeklyProjection>> {
  const [season, week] = key.split(":");
  const response = await fetch(`${API}/projections/nfl/${season}/${week}?season_type=regular`, {
    cache: "no-store",
    headers: { "User-Agent": "Sleeper Fantasy Dashboard/0.1" },
  });
  if (!response.ok) throw new Error(`Sleeper projections returned ${response.status}`);
  const rows = (await response.json()) as SleeperProjection[];
  return new Map(rows.flatMap((row) => row.stats ? [[row.player_id, { stats: row.stats, opponent: row.opponent ?? null }] as const] : []));
}

// Sleeper's undocumented projection feed is large, so one week is kept in process memory rather
// than going through the data cache. Projections are decoration: a failed load degrades to none.
const projectionMemo = createMemo({ load: loadWeeklyProjections, ttlMs: CACHE_TTL_MS, onError: () => new Map<string, WeeklyProjection>() });

export function getWeeklyProjections(season: string, week: number) {
  return projectionMemo.get(`${season}:${week}`);
}

export function scoreProjection(stats: Record<string, number> | undefined, scoring: Record<string, number>) {
  if (!stats) return null;
  const total = Object.entries(scoring).reduce((sum, [key, multiplier]) => sum + (stats[key] ?? 0) * multiplier, 0);
  return Number.isFinite(total) ? Math.max(0, total) : null;
}

function normalCdf(value: number) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = sign * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
  return (1 + erf) / 2;
}

/** A transparent estimate, not a sportsbook line: projected-score edge with 28% team variance. */
export function projectedWinProbability(home: number, away: number, uncertainty = Math.max(12, 0.28 * Math.hypot(home, away))) {
  const probability = normalCdf((home - away) / Math.max(uncertainty, 1e-6));
  return Math.round(Math.min(0.97, Math.max(0.03, probability)) * 100);
}

/** One starter's contribution to a live projection: what it has banked and what it may still add. */
export type LiveSlotInput = { points: number | null; projection: number | null; state: "pre" | "in" | "post" | null };

export type LiveForecast = {
  /** Points already scored plus the projected remainder of games still to play. */
  mean: number;
  /** Standard deviation of the points still outstanding; zero once every starter is final. */
  deviation: number;
};

/**
 * Projects a team's final score from a week in progress.
 *
 * A starter whose game is over contributes exactly what it scored and no variance. One yet to
 * kick off contributes its full projection. One mid-game contributes its points so far plus the
 * share of its projection matching the time left, which is approximated as half the game — Sleeper
 * exposes no game clock here, so the estimate is deliberately coarse.
 *
 * Variance is carried per unplayed slot (35% of the outstanding projection, floored so a scoreless
 * projection is not treated as certain) and added in quadrature, which is what makes the number
 * converge as the week resolves rather than sitting at its pregame value.
 */
export function liveForecast(slots: LiveSlotInput[]): LiveForecast | null {
  let mean = 0;
  let variance = 0;
  let known = false;

  for (const slot of slots) {
    const scored = slot.points ?? 0;
    const projection = slot.projection;
    // Without a projection, points only mean something alongside a game state that says whether
    // they are final or still accruing — and an empty slot has neither. When every slot is skipped
    // the caller gets null and shows no probability rather than a confident-looking 50%.
    if (projection == null && (slot.points == null || slot.state == null)) continue;
    known = true;

    if (slot.state === "post") { mean += scored; continue; }
    const remainingShare = slot.state === "in" ? 0.5 : 1;
    // Mid-game, the projection's remaining share can undershoot what the player already banked;
    // the outstanding amount floors at zero so a hot start never subtracts from the forecast.
    const outstanding = Math.max(0, (projection ?? scored) * remainingShare);
    mean += scored + outstanding;
    const spread = Math.max(3, 0.35 * (projection ?? scored)) * remainingShare;
    variance += spread * spread;
  }

  return known ? { mean, deviation: Math.sqrt(variance) } : null;
}

/** Win probability between two live forecasts, tightening as each side's games go final. */
export function liveWinProbability(home: LiveForecast, away: LiveForecast) {
  const deviation = Math.hypot(home.deviation, away.deviation);
  // Both sides final: the result is settled, so report it as such instead of a hedged percentage.
  if (deviation < 1e-6) return home.mean === away.mean ? 50 : home.mean > away.mean ? 100 : 0;
  return projectedWinProbability(home.mean, away.mean, deviation);
}
