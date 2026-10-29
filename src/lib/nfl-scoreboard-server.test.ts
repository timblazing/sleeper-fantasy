import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentNflScoreboard, resetNflScoreboardCacheForTests } from "@/lib/nfl-scoreboard-server";

const team = (id: string, homeAway: string) => ({ homeAway, team: { id, displayName: id, abbreviation: id }, score: "7" });
const slate = (state: "pre" | "in" | "post", date: string) => ({
  season: { year: 2026, type: 2 },
  week: { number: 8 },
  events: [{ id: "1", competitions: [{ date, status: { type: { state, shortDetail: "" } }, competitors: [team("CLE", "home"), team("CAR", "away")] }] }],
});
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;

const now = Date.parse("2026-10-25T17:30:00Z");
const fetchMock = vi.fn();
beforeEach(() => {
  vi.useFakeTimers({ now });
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  resetNflScoreboardCacheForTests();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("getCurrentNflScoreboard", () => {
  it("shares one ESPN read between viewers while a game is live", async () => {
    fetchMock.mockResolvedValue(ok(slate("in", "2026-10-25T17:00Z")));
    await getCurrentNflScoreboard();
    await getCurrentNflScoreboard();
    expect(fetchMock).toHaveBeenCalledTimes(2); // current-week discovery + the slate, once each

    vi.advanceTimersByTime(16_000);
    await getCurrentNflScoreboard();
    // The live slate expires within seconds; the week discovery does not.
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("holds an all-final slate far longer than a live one", async () => {
    fetchMock.mockResolvedValue(ok(slate("post", "2026-10-25T13:00Z")));
    await getCurrentNflScoreboard();
    vi.advanceTimersByTime(4 * 60_000);
    await getCurrentNflScoreboard();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
