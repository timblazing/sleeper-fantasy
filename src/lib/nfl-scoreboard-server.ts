import "server-only";
import { fetchCached } from "@/lib/fetch-cached";
import { createMemo } from "@/lib/memo";
import { gameRefreshMs, slateRefreshMs } from "@/lib/live-refresh";
import { normalizeScoreboard, normalizeSummary, type GameSummary, type NflScoreboard } from "@/lib/nfl-scoreboard";

const SITE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

/**
 * Every open tab polls the scoreboard, so the upstream read is shared: one ESPN fetch per window
 * per server process however many people are watching. The window follows game state — seconds
 * while a game is live, minutes before kickoff, an hour once a game is final.
 */
const LIVE_MS = 15_000;
const IDLE_MS = 5 * 60_000;
const FINAL_MS = 60 * 60_000;
/** ESPN's current season/week only rolls over once a week, so discovering it is cached longer. */
const CURRENT_WEEK_MS = 10 * 60_000;

type CurrentWeek = Pick<NflScoreboard, "season" | "seasonType" | "week">;

// The unfiltered NFL endpoint selects ESPN's current season/week, independently of the
// fantasy league's season. Explicit week parameters then include the entire weekly slate.
const currentWeekMemo = createMemo<"nfl", CurrentWeek>({
  load: async () => {
    const { season, seasonType, week } = normalizeScoreboard(await fetchCached<unknown>(`${SITE}/scoreboard?limit=100`, { ttl: "live" }));
    return { season, seasonType, week };
  },
  ttlMs: CURRENT_WEEK_MS,
  onError: "throw",
});

/** Keyed `${season}:${seasonType}:${week}`; only the current week is ever requested, so a few keys suffice. */
const slateMemo = createMemo<string, NflScoreboard>({
  load: async (key) => {
    const [season, seasonType, week] = key.split(":");
    return normalizeScoreboard(await fetchCached<unknown>(`${SITE}/scoreboard?dates=${season}&seasontype=${seasonType}&week=${week}&limit=100`, { ttl: "live" }));
  },
  ttlMs: (board) => slateRefreshMs(board.games, { liveMs: LIVE_MS, idleMs: IDLE_MS }),
  maxKeys: 4,
  onError: "throw",
});

// Event ids come from the URL, so the key space is caller-controlled: `maxKeys` bounds it to
// roughly a week's slate and the route's rate limit bounds how fast it can be churned.
const summaryMemo = createMemo<string, GameSummary>({
  load: async (eventId) => normalizeSummary(await fetchCached<unknown>(`${SITE}/summary?event=${eventId}`, { ttl: "live" })),
  ttlMs: ({ game }) => gameRefreshMs(game, { liveMs: LIVE_MS, idleMs: IDLE_MS }) ?? FINAL_MS,
  maxKeys: 32,
  onError: "throw",
});

export async function getCurrentNflScoreboard() {
  const { season, seasonType, week } = await currentWeekMemo.get("nfl");
  return slateMemo.get(`${season}:${seasonType}:${week}`);
}

export function getNflGameSummary(eventId: string) {
  return summaryMemo.get(eventId);
}

/** Test hook. */
export function resetNflScoreboardCacheForTests() {
  currentWeekMemo.reset();
  slateMemo.reset();
  summaryMemo.reset();
}
