import "server-only";
import { fetchCached, type CacheTtl } from "@/lib/fetch-cached";
import { describeLeagueType, isDynastyLeague } from "@/lib/league-features";
import type { NflState, SleeperAccount, SleeperBracketGame, SleeperDraft, SleeperDraftPick, SleeperLeague, SleeperMatchup, SleeperRoster, SleeperTradedPick, SleeperTransaction, SleeperUser } from "@/lib/types";
const API = "https://api.sleeper.app/v1";
function sleeper<T>(path: string, ttl: CacheTtl) { return fetchCached<T>(`${API}${path}`, { ttl }); }
// The week and season phase flip mid-Sunday; a stale read points every other query at the wrong week.
export const getNflState = () => sleeper<NflState>("/state/nfl", "live");
export const getUser = (username: string) => sleeper<SleeperUser>(`/user/${encodeURIComponent(username)}`, 3600);
export const getUserLeagues = (userId: string, season: string) => sleeper<SleeperLeague[]>(`/user/${userId}/leagues/nfl/${season}`, 300);
// These functions assume `id` has already been validated (see `isLeagueId`) — encoding the
// upstream URL path below is defense in depth only.
export const getLeague = (id: string) => sleeper<SleeperLeague>(`/league/${encodeURIComponent(id)}`, 3600);
export const getLeagueUsers = (id: string) => sleeper<SleeperUser[]>(`/league/${encodeURIComponent(id)}/users`, 3600);
// Rosters, matchups and transactions move during the current week, so they default to uncached.
// A caller that knows the read is settled (see `settledTtl`) passes a longer ttl.
export const getLeagueRosters = (id: string, ttl: CacheTtl = "live") => sleeper<SleeperRoster[]>(`/league/${encodeURIComponent(id)}/rosters`, ttl);
export const getMatchups = (id: string, week: number, ttl: CacheTtl = "live") => sleeper<SleeperMatchup[]>(`/league/${encodeURIComponent(id)}/matchups/${week}`, ttl);
export const getTransactions = (id: string, week: number, ttl: CacheTtl = "live") => sleeper<SleeperTransaction[]>(`/league/${encodeURIComponent(id)}/transactions/${week}`, ttl);

/** A week behind the current one: scores only move on stat corrections, which an hour absorbs. */
export const SETTLED_WEEK_TTL = 3600;
/** A finished season does not change at all; a week only bounds how long a correction could linger. */
export const FINISHED_SEASON_TTL = 7 * 86400;

/** Whether `league` is a season that is over — complete, or older than the NFL's current season. */
export function isFinishedSeason(league: Pick<SleeperLeague, "season" | "status">, state: Pick<NflState, "season">) {
  return league.status === "complete" || Number(league.season) < Number(state.season);
}

/**
 * How long a league's per-week read can be cached. Finished seasons cache for a week, weeks
 * already behind the NFL's current week for an hour, and the current week (or anything ahead of
 * it) stays live. `week` omitted means a season-level read such as rosters.
 */
export function settledTtl(league: Pick<SleeperLeague, "season" | "status">, state: Pick<NflState, "season" | "week">, week?: number): CacheTtl {
  if (isFinishedSeason(league, state)) return FINISHED_SEASON_TTL;
  if (week !== undefined && league.season === state.season && week < (state.week ?? 0)) return SETTLED_WEEK_TTL;
  return "live";
}
// Completed seasons never change, so the brackets that decide final placements cache for a day.
export const getWinnersBracket = (id: string) => sleeper<SleeperBracketGame[]>(`/league/${encodeURIComponent(id)}/winners_bracket`, 86400);
export const getLosersBracket = (id: string) => sleeper<SleeperBracketGame[]>(`/league/${encodeURIComponent(id)}/losers_bracket`, 86400);
export const getLeagueDrafts = (id: string) => sleeper<SleeperDraft[]>(`/league/${encodeURIComponent(id)}/drafts`, 3600);
export const getDraftPicks = (id: string) => sleeper<SleeperDraftPick[]>(`/draft/${encodeURIComponent(id)}/picks`, 3600);
// Which slots changed hands before the draft ran. A completed draft never trades another pick, so this caches for a day.
export const getDraftTradedPicks = (id: string) => sleeper<SleeperTradedPick[]>(`/draft/${encodeURIComponent(id)}/traded_picks`, 86400);

/**
 * Every league id in a dynasty's lineage, newest season first.
 *
 * Sleeper models a continuing dynasty as one league object per season chained by
 * `previous_league_id`, so behavioural history (trades, waivers, drafts) is only reachable by
 * walking the chain. `limit` bounds the walk so a long-running league cannot unbound the read.
 */
export async function getLeagueLineage(id: string, limit = 4): Promise<string[]> {
  const lineage: string[] = [];
  let current: string | null = id;
  while (current && lineage.length < limit) {
    lineage.push(current);
    const league: SleeperLeague | null = await getLeague(current).catch(() => null);
    const previous: string | null = league?.previous_league_id ?? null;
    // A league that points at itself would spin forever; a repeat means the chain is done.
    current = previous && !lineage.includes(previous) ? previous : null;
  }
  return lineage;
}

export async function getNflLeaguesForUsername(username: string, season?: string): Promise<SleeperAccount> {
  const cleanUsername = username.trim();
  const [user, state] = await Promise.all([getUser(cleanUsername), season ? Promise.resolve(null) : getNflState()]);
  if (!user?.user_id) throw new Error("Sleeper user not found");

  const targetSeason = season ?? state?.season;
  if (!targetSeason) throw new Error("The current NFL season is unavailable");
  const leagueSummaries = await getUserLeagues(user.user_id, targetSeason);
  const verifiedLeagues = await Promise.all(leagueSummaries.map((league) => getLeague(league.league_id).catch(() => null)));
  const statusOrder: Record<string, number> = { in_season: 0, drafting: 1, pre_draft: 2, complete: 3 };
  const leagues = verifiedLeagues
    .filter((league): league is SleeperLeague => league?.sport.toLowerCase() === "nfl")
    .toSorted((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) || a.name.localeCompare(b.name))
    .map((league) => ({ id: league.league_id, name: league.name, season: league.season, status: league.status, type: describeLeagueType(league), isDynasty: isDynastyLeague(league), avatar: league.avatar }));

  return { userId: user.user_id, username: user.username || cleanUsername, displayName: user.display_name || user.username || cleanUsername, avatar: user.avatar, leagues };
}
