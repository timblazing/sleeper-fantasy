import { getLeagueValueContext, type LeagueValueContext } from "@/lib/league-values";
import { liveSource, type LeagueSource } from "@/lib/league-source";
import { scoreProjection, type WeeklyProjection } from "@/lib/projections";
import type { NflPlayer, SleeperMatchup } from "@/lib/types";

export type ScoringWeek = { week: number; average: number; scores: Record<number, number> };
export type WaiverCandidate = { player: NflPlayer; score: number };
export type DashboardPulse = { scoring: ScoringWeek[]; waivers: WaiverCandidate[]; waiverBasis: "weekly" | "dynasty" | "redraft"; week: number; waiverReady: boolean; scoringReady: boolean };

const SKILL_POSITIONS = new Set(["QB", "RB", "WR", "TE"]);
const UNAVAILABLE = new Set(["Out", "IR", "PUP", "Sus", "NA", "DNR"]);

/** Availability is league-specific; weekly projections use this league's scoring rules. */
export function rankAvailablePlayers(context: LeagueValueContext, projections: Map<string, WeeklyProjection>) {
  const weekly = context.regularSeason && projections.size > 0;
  const waivers = [...context.catalog.values()].flatMap(player => {
    if (!SKILL_POSITIONS.has(player.position ?? "") || !player.team || context.rosterByPlayer.has(player.id)
      || UNAVAILABLE.has(player.injuryStatus ?? "") || (player.status && player.status !== "Active")) return [];
    const score = weekly ? scoreProjection(projections.get(player.id)?.stats, context.league.scoring_settings) : context.values.get(player.id);
    return score != null && Number.isFinite(score) && score > 0 ? [{ player, score }] : [];
  }).toSorted((a, b) => b.score - a.score || a.player.name.localeCompare(b.player.name));
  const counts = new Map<string, number>();
  const shortlisted = waivers.filter(({ player }) => {
    const position = player.position!;
    const count = counts.get(position) ?? 0;
    counts.set(position, count + 1);
    return count < 5;
  });
  return { waiverReady: context.catalogReady && (weekly || context.valuesReady), waivers: shortlisted, waiverBasis: weekly ? "weekly" as const : context.basis };
}

/** Missing or unplayed weeks stay gaps, and a real zero is retained. */
export function scoringWeek(week: number, rows: SleeperMatchup[]): ScoringWeek | null {
  const scored = rows.filter(row => Number.isFinite(row.points));
  if (!scored.length || !scored.some(row => row.points !== 0)) return null;
  return { week, average: scored.reduce((sum, row) => sum + row.points, 0) / scored.length,
    scores: Object.fromEntries(scored.map(row => [row.roster_id, row.points])) };
}

export async function getDashboardPulse(leagueId: string, source: LeagueSource = liveSource): Promise<DashboardPulse> {
  const context = await getLeagueValueContext(leagueId, source);
  // Do not use the current NFL week to query a past league's future schedule.
  const sameSeason = context.league.season === context.state.season;
  const lastWeek = sameSeason && context.regularSeason ? Math.min(18, context.week - 1) : 0;
  const weeks = Array.from({ length: Math.min(6, Math.max(0, lastWeek)) }, (_, i) => lastWeek - Math.min(6, lastWeek) + i + 1);
  const [history, projections] = await Promise.all([
    Promise.all(weeks.map(async week => {
      try { return { ok: true, row: scoringWeek(week, await source.getMatchups(leagueId, week)) }; }
      catch { return { ok: false, row: null }; }
    })),
    sameSeason && context.regularSeason ? source.getWeeklyProjections(context.league.season, context.matchupWeek).catch(() => new Map<string, WeeklyProjection>()) : new Map<string, WeeklyProjection>(),
  ]);
  return { scoringReady: history.every(result => result.ok), scoring: history.flatMap(result => result.row ? [result.row] : []), ...rankAvailablePlayers(context, projections), week: context.matchupWeek };
}
