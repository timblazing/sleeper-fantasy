// Kept apart from `nfl-scoreboard.ts` so the browser poll can import it without pulling zod in.

/** The two fields a refresh decision needs, in the scoreboard's normalized vocabulary. */
export type SlateGame = { state: "live" | "upcoming" | "final"; kickoff: string };

/** Browser cadence: every 30s while a game is live, otherwise at most every 15 minutes. */
export const CLIENT_REFRESH = { liveMs: 30_000, idleMs: 15 * 60_000 };

/**
 * How long a slate stays current: a live game moves every play, an upcoming one only changes at
 * kickoff, and a finished one never does. Shared by the browser poll and the server-side cache so
 * both slow down together when nothing is on.
 *
 * A game still marked upcoming after its kickoff (a weather delay, a feed that is slow to flip)
 * is treated as about to go live.
 */
export function slateRefreshMs(
  games: SlateGame[],
  { liveMs, idleMs, now = Date.now() }: { liveMs: number; idleMs: number; now?: number },
): number {
  if (games.some((game) => game.state === "live")) return liveMs;
  let refresh = idleMs;
  for (const game of games) {
    if (game.state !== "upcoming") continue;
    const kickoff = Date.parse(game.kickoff);
    if (!Number.isFinite(kickoff)) continue;
    refresh = Math.min(refresh, Math.max(liveMs, kickoff - now));
  }
  return refresh;
}

/** A game's own cadence; a finished game never changes again, so its poll stops (`null`). */
export function gameRefreshMs(game: SlateGame, timing: { liveMs: number; idleMs: number; now?: number }): number | null {
  return game.state === "final" ? null : slateRefreshMs([game], timing);
}
