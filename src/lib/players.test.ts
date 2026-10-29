import { afterEach, describe, expect, it, vi } from "vitest";
import { getPlayerCatalog, resetPlayerCatalog } from "@/lib/players";

const mahomes = { "4046": { full_name: "Patrick Mahomes", position: "QB", team: "KC" } };

afterEach(() => {
  resetPlayerCatalog();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("getPlayerCatalog", () => {
  it("fetches and trims Sleeper's player map", async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify(mahomes)));
    vi.stubGlobal("fetch", fetchSpy);
    const catalog = await getPlayerCatalog();
    expect(fetchSpy).toHaveBeenCalledWith("https://api.sleeper.app/v1/players/nfl", expect.anything());
    expect(catalog.get("4046")?.name).toBe("Patrick Mahomes");
  });

  it("fetches once a day and keeps the last good catalog when a refresh fails", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify(mahomes)));
    vi.stubGlobal("fetch", fetchSpy);
    const first = await getPlayerCatalog();
    expect(await getPlayerCatalog()).toBe(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockResolvedValue(new Response("unavailable", { status: 503 }));
    vi.advanceTimersByTime(25 * 60 * 60 * 1000);
    expect(await getPlayerCatalog()).toBe(first);
  });
});
