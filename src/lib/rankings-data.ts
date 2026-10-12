import { deriveLeagueFormat, isSuperflexLeague } from "@/lib/league-features";
import { toProjectedPpg } from "@/lib/redraft-values";
import { getPlayerCatalog, NFL_TEAMS } from "@/lib/players";
import { ROOM_POSITIONS } from "@/lib/roster-positions";
import { getMovers, getPicks, getPresets, getProjectedPpg, getRankings, resolvePreset } from "@/lib/roster-audit";
import type { Attribution, RaError, RaPick, RaPlayerValue, RaPreset, RaProjectedPlayer } from "@/lib/roster-audit";
import { getLeague, getLeagueRosters, getLeagueUsers, getNflLeaguesForUsername } from "@/lib/sleeper";
import type { RankingsQuery } from "@/lib/rankings-query";
import type { NflPlayer, SleeperLeague } from "@/lib/types";
import type { ValueBasis } from "@/lib/value-basis";

export const RANKINGS_PER_PAGE = 50; // rosteraudit-api-reference.md §2.4: the real per_page floor is 10; 50 matches the vendor UI.
const FALLBACK_ATTRIBUTION: Attribution = { text: "Values by RosterAudit.com", url: "https://rosteraudit.com" };

export type RankingsOwner = { teamName: string; isMine: boolean };
export type RankingsPlayerRow = { kind: "player"; key: string; rank: number; sleeperId: string; name: string; position: string; team: string | null; age: number | null; tier: number | null; value: number; valueAvailable?: boolean; trend7d: number; rankPosition: number | null; photoUrl: string | null; owner: RankingsOwner | null };
export type RankingsPickRow = { kind: "pick"; key: string; rank: number; label: string; value: number };
export type RankingsRow = RankingsPlayerRow | RankingsPickRow;
export type RankingsMover = { sleeperId: string; name: string; position: string; team: string | null; trend7d: number };
export type RankingsView = {
  leagueId: string; leagueName: string; leagueSummary: string; isSuperflex: boolean;
  /** Which currency every `value` on this board is quoted in. */
  basis: ValueBasis;
  presetKey: string; presetLabel: string; positions?: string[];
  rows: RankingsRow[]; total: number; totalLabel: string; page: number; totalPages: number; maxValue: number;
  movers: { risers: RankingsMover[]; fallers: RankingsMover[] } | null;
  attribution: Attribution;
};
export type RankingsResult = { ok: true; view: RankingsView } | { ok: false; error: RaError };

// The demo has no connected league; use a shape that derives a real preset.
const DEMO_LEAGUE: SleeperLeague = { league_id: "demo", name: "Sunday Syndicate", season: "2026", sport: "nfl", status: "in_season", avatar: null, previous_league_id: null, roster_positions: ["QB", "RB", "RB", "WR", "WR", "TE", "SUPER_FLEX"], scoring_settings: { rec: 1 }, settings: { num_teams: 12, type: 2 } };

const upstream = (message: string): RaError => ({ kind: "upstream-unavailable", message, retryable: true });
const pickValue = (pick: RaPick, isSuperflex: boolean) => (isSuperflex ? pick.valueSf : pick.value1qb); // Never `sf ?? 1qb` — that is the §2.8 regression.
const toMover = (player: RaPlayerValue): RankingsMover => ({ sleeperId: player.sleeperId, name: player.name, position: player.position, team: player.team, trend7d: player.trend7d });

function describeLeague(league: SleeperLeague, preset: RaPreset): string {
  const teams = league.settings.num_teams ?? preset.leagueSize;
  return [`${teams}T`, preset.isSuperflex ? "SF" : "1QB", preset.scoringFormat.toUpperCase(), preset.isTep ? "TEP" : null].filter(Boolean).join(" · ");
}

async function loadOwnership(leagueId: string, username?: string): Promise<Map<string, RankingsOwner>> {
  const map = new Map<string, RankingsOwner>();
  if (leagueId === "demo") return map;
  try {
    const [rosters, users, account] = await Promise.all([
      getLeagueRosters(leagueId),
      getLeagueUsers(leagueId),
      username ? getNflLeaguesForUsername(username).catch(() => undefined) : undefined,
    ]);
    const userById = new Map(users.map((user) => [user.user_id, user]));
    for (const roster of rosters) {
      const user = roster.owner_id ? userById.get(roster.owner_id) : undefined;
      // Team-name expression taken verbatim from src/lib/dashboard-data.ts.
      const teamName = user?.metadata?.team_name || user?.display_name || `Roster ${roster.roster_id}`;
      const isMine = Boolean(account && roster.owner_id && roster.owner_id === account.userId);
      for (const playerId of roster.players ?? []) map.set(playerId, { teamName, isMine });
    }
  } catch {
    return map;
  }
  return map;
}

/** Draft picks are merged into the player list only where the merge is meaningful.
 *  Picks have no age and no player name, so interleaving them into an age- or name-sorted
 *  list, or into a single-position tab, would be nonsense. `position=picks` shows picks
 *  only; QB/RB/WR/TE show players only; `all` + `sort=value` is the interleaved view
 *  Picks are sourced separately from /picks. */
const shouldMergePicks = (query: RankingsQuery) => query.sort === "value" && query.position === "all";

/** Always show the offensive pool; optional positions follow the league's actual slots. */
const leaguePositions = (league: SleeperLeague): string[] => [
  ...ROOM_POSITIONS, ...["DEF", "K"].filter((position) => league.roster_positions.includes(position)),
];

const isNflTeam = (team: string | null): boolean => team !== null && Object.hasOwn(NFL_TEAMS, team);

function catalogPool(catalog: Map<string, NflPlayer>, positions: string[], ownership: Map<string, RankingsOwner>): NflPlayer[] {
  return [...catalog.values()].filter((player) => player.position !== null && positions.includes(player.position) && isNflTeam(player.team)
    && (player.status !== "Inactive" || ownership.has(player.id)));
}

const describeRedraftLeague = (league: SleeperLeague): string =>
  [`${league.settings.num_teams ?? 12}T`, isSuperflexLeague(league) ? "SF" : "1QB", "PPR"].join(" · ");

/** Complete Sleeper player pool enriched with PPR projections. Raw projected PPG is
 * shared with the roster and player-detail views. */
async function redraftRankingsView(leagueId: string, league: SleeperLeague, query: RankingsQuery): Promise<RankingsResult> {
  const [projected, ownership, catalog] = await Promise.all([getProjectedPpg(), loadOwnership(leagueId, query.username), getPlayerCatalog().catch(() => null)]);
  if (!catalog) return { ok: false, error: upstream("Sleeper player directory unavailable") };
  if (!projected.ok) return { ok: false, error: projected.error };

  const positions = leaguePositions(league);
  const eligibleProjections = projected.data.filter(player => isNflTeam(catalog.has(player.sleeperId) ? catalog.get(player.sleeperId)!.team : player.team));
  const values = toProjectedPpg(eligibleProjections);
  // Catalog membership is independent of projection coverage. Missing values stay unknown.
  const pool = new Map<string, Omit<RaProjectedPlayer, "ppg">>();
  for (const player of catalogPool(catalog, positions, ownership)) pool.set(player.id, { sleeperId: player.id, name: player.name, position: player.position!, team: player.team, age: player.age });
  for (const player of eligibleProjections) if (positions.includes(player.position)) pool.set(player.sleeperId, { ...player, ...pool.get(player.sleeperId) });
  const position = query.position === "picks" || query.position === "rookies" ? "all" : query.position;
  const needle = query.search.trim().toLowerCase();

  const matches = (player: Omit<RaProjectedPlayer, "ppg">) =>
    positions.includes(player.position) && isNflTeam(player.team)
    && (position === "all" || player.position === position)
    && (!needle || player.name.toLowerCase().includes(needle))
    && (query.minAge === undefined || (player.age !== null && player.age >= query.minAge))
    && (query.maxAge === undefined || (player.age !== null && player.age <= query.maxAge));

  const ranked = [...pool.values()]
    .filter(matches)
    .map((player) => ({ player, value: values.get(player.sleeperId) ?? 0 }))
    .toSorted((a, b) => {
      if (query.sort === "name") return a.player.name.localeCompare(b.player.name);
      // Nulls last, so an unknown age never claims the top of the youngest-first list.
      if (query.sort === "age") return (a.player.age ?? Infinity) - (b.player.age ?? Infinity) || a.player.name.localeCompare(b.player.name);
      return Number(values.has(b.player.sleeperId)) - Number(values.has(a.player.sleeperId)) || b.value - a.value || a.player.name.localeCompare(b.player.name);
    });

  // Position rank is the standing on the full board, not within the current filter, so "RB3"
  // still means RB3 after a search narrows the page to one player.
  const positionRank = new Map<string, number>();
  for (const room of ROOM_POSITIONS) {
    eligibleProjections
      .filter((player) => player.position === room)
      .toSorted((a, b) => (values.get(b.sleeperId) ?? 0) - (values.get(a.sleeperId) ?? 0))
      .forEach((player, index) => positionRank.set(player.sleeperId, index + 1));
  }

  const total = ranked.length;
  const totalPages = Math.max(1, Math.ceil(total / RANKINGS_PER_PAGE));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * RANKINGS_PER_PAGE;
  const rows: RankingsRow[] = ranked.slice(start, start + RANKINGS_PER_PAGE).map(({ player, value }, index) => ({
    kind: "player",
    key: `player-${player.sleeperId}`,
    rank: start + index + 1,
    sleeperId: player.sleeperId,
    name: player.name,
    position: player.position,
    team: player.team,
    age: player.age,
    tier: null,
    value,
    valueAvailable: values.has(player.sleeperId),
    // The projection board publishes no movement, and a dynasty trend would be the wrong number.
    trend7d: 0,
    rankPosition: positionRank.get(player.sleeperId) ?? null,
    photoUrl: null,
    owner: ownership.get(player.sleeperId) ?? null,
  }));

  const format = deriveLeagueFormat(league);
  return {
    ok: true,
    view: {
      leagueId, leagueName: league.name, leagueSummary: describeRedraftLeague(league), isSuperflex: format.superflex,
      basis: "redraft", positions, presetKey: format.presetKey, presetLabel: "Projected PPG",
      rows, total, totalLabel: `${total.toLocaleString()} ${total === 1 ? "player" : "players"}`,
      page, totalPages, maxValue: rows.reduce((max, row) => Math.max(max, row.value), 0),
      movers: null, attribution: projected.attribution,
    },
  };
}

export async function getRankingsView(leagueId: string, query: RankingsQuery): Promise<RankingsResult> {
  let league: SleeperLeague;
  if (leagueId === "demo") league = DEMO_LEAGUE;
  else {
    try { league = await getLeague(leagueId); } catch (error) { return { ok: false, error: upstream(error instanceof Error ? error.message : "Sleeper league unavailable") }; }
  }

  if (deriveLeagueFormat(league).basis === "redraft") return redraftRankingsView(leagueId, league, query);

  const presetsResult = await getPresets();
  if (!presetsResult.ok) return { ok: false, error: presetsResult.error };
  // No override argument: the scoring format is a property of the connected league, not a
  // control. `resolvePreset` derives it from roster_positions + scoring_settings, so a
  // superflex TE-premium league only ever sees superflex TE-premium values.
  const preset = resolvePreset(league, undefined, presetsResult.data);
  if (!preset) return { ok: false, error: { kind: "invalid-response", message: "No RosterAudit preset matches this league", retryable: false } };
  const isSuperflex = preset.isSuperflex;

  const picksOnly = query.position === "picks";
  const positions = leaguePositions(league);
  const [rankingsResult, picksResult, moversResult, ownership, catalog] = await Promise.all([
    picksOnly ? undefined : getRankings({ preset: preset.key, perPage: 100, page: 1, sort: "value", leagueSize: preset.leagueSize }),
    picksOnly || shouldMergePicks(query) ? getPicks() : undefined,
    getMovers({ limit: 5 }),
    loadOwnership(leagueId, query.username),
    picksOnly ? undefined : getPlayerCatalog().catch(() => null),
  ]);
  if (rankingsResult && !rankingsResult.ok) return { ok: false, error: rankingsResult.error };
  if (picksOnly && picksResult && !picksResult.ok) return { ok: false, error: picksResult.error };
  if (!picksOnly && !catalog) return { ok: false, error: upstream("Sleeper player directory unavailable") };

  const pool = new Map<string, RankingsPlayerRow & { yearsExp: number | null }>();
  if (catalog) for (const player of catalogPool(catalog, positions, ownership)) pool.set(player.id, {
    kind: "player", key: `player-${player.id}`, rank: 0, sleeperId: player.id, name: player.name,
    position: player.position!, team: player.team, age: player.age, yearsExp: player.yearsExp,
    tier: null, value: 0, valueAvailable: false, trend7d: 0, rankPosition: null, photoUrl: null,
    owner: ownership.get(player.id) ?? null,
  });
  if (rankingsResult?.ok) {
    // Load every vendor page before local filtering and pagination. A top-page fetch cannot
    // establish the complete player pool, rookie pool, or merged pick ordering.
    const rest = await Promise.all(Array.from({ length: Math.max(0, rankingsResult.data.totalPages - 1) }, (_, index) =>
      getRankings({ preset: preset.key, perPage: 100, page: index + 2, sort: "value", leagueSize: preset.leagueSize })));
    for (const result of [rankingsResult, ...rest]) {
      if (!result.ok) return { ok: false, error: result.error };
      for (const player of result.data.items) if (positions.includes(player.position)) pool.set(player.sleeperId, {
        kind: "player", key: `player-${player.sleeperId}`, rank: 0, ...player,
        name: catalog?.get(player.sleeperId)?.name ?? player.name,
        age: catalog?.get(player.sleeperId)?.age ?? player.age,
        yearsExp: player.yearsExp ?? catalog?.get(player.sleeperId)?.yearsExp ?? null,
        team: catalog?.has(player.sleeperId) ? catalog.get(player.sleeperId)!.team : player.team,
        valueAvailable: true, owner: ownership.get(player.sleeperId) ?? null,
      });
    }
  }
  const needle = query.search.toLowerCase();
  const filtered: RankingsRow[] = picksOnly ? [] : [...pool.values()].filter((player) =>
    isNflTeam(player.team) && (query.position === "all" || (query.position === "rookies" ? player.yearsExp === 0 : player.position === query.position))
    && (!needle || player.name.toLowerCase().includes(needle))
    && (query.minAge === undefined || (player.age !== null && player.age >= query.minAge))
    && (query.maxAge === undefined || (player.age !== null && player.age <= query.maxAge)));
  if (picksResult?.ok) for (const pick of picksResult.data) {
    if (!needle || pick.label.toLowerCase().includes(needle)) filtered.push({ kind: "pick", key: `pick-${pick.id}`, rank: 0, label: pick.label, value: pickValue(pick, isSuperflex) });
  }
  const name = (row: RankingsRow) => row.kind === "player" ? row.name : row.label;
  filtered.sort((a, b) => {
    if (query.sort === "name") return name(a).localeCompare(name(b));
    if (query.sort === "age") return (a.kind === "player" ? a.age ?? Infinity : Infinity) - (b.kind === "player" ? b.age ?? Infinity : Infinity) || name(a).localeCompare(name(b));
    return Number(b.kind === "pick" || b.valueAvailable !== false) - Number(a.kind === "pick" || a.valueAvailable !== false) || b.value - a.value || name(a).localeCompare(name(b));
  });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / RANKINGS_PER_PAGE));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * RANKINGS_PER_PAGE;
  const rows = filtered.slice(start, start + RANKINGS_PER_PAGE).map((row, index) => ({ ...row, rank: start + index + 1 }));
  const rookiesOnly = query.position === "rookies";
  const attribution = (rankingsResult?.ok ? rankingsResult.attribution : picksResult?.ok ? picksResult.attribution : undefined) ?? FALLBACK_ATTRIBUTION;

  // rosteraudit-api-reference.md §2.6: the /movers percent-change field is off by ~10,000x,
  // so only trend fields cross this boundary; §3 notes /movers carries no val_1qb at all.
  const movers = moversResult.ok ? { risers: moversResult.data.risers.map(toMover), fallers: moversResult.data.fallers.map(toMover) } : null;
  const maxValue = rows.reduce((max, row) => Math.max(max, row.value), 0);

  return {
    ok: true,
    view: {
      leagueId, leagueName: league.name, leagueSummary: describeLeague(league, preset), isSuperflex,
      basis: "dynasty", positions, presetKey: preset.key, presetLabel: preset.label,
      rows, total, totalLabel: `${total.toLocaleString()} ${picksOnly ? (total === 1 ? "pick" : "picks") : rookiesOnly ? (total === 1 ? "rookie" : "rookies") : total === 1 ? "player" : "players"}`,
      page, totalPages, maxValue, movers, attribution,
    },
  };
}
