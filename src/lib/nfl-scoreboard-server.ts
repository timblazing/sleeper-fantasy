import "server-only";
import { fetchCached } from "@/lib/fetch-cached";
import { normalizeScoreboard, normalizeSummary } from "@/lib/nfl-scoreboard";

const SITE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

// The unfiltered NFL endpoint selects ESPN's current season/week, independently of the
// fantasy league's season. Explicit week parameters then include the entire weekly slate.
export async function getCurrentNflScoreboard() {
  const current = normalizeScoreboard(
    await fetchCached<unknown>(`${SITE}/scoreboard?limit=100`, { ttl: "live" }),
  );
  return normalizeScoreboard(
    await fetchCached<unknown>(
      `${SITE}/scoreboard?dates=${current.season}&seasontype=${current.seasonType}&week=${current.week}&limit=100`,
      { ttl: "live" },
    ),
  );
}

export async function getNflGameSummary(eventId: string) {
  return normalizeSummary(
    await fetchCached<unknown>(`${SITE}/summary?event=${eventId}`, {
      ttl: "live",
    }),
  );
}
