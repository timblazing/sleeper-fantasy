import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("@/lib/player-market");
  vi.resetModules();
});

function request(query?: string) {
  const url = new URL("http://localhost/api/leagues/league-1/players");
  if (query !== undefined) url.searchParams.set("q", query);
  return new Request(url);
}

async function getRoute(search = vi.fn()) {
  vi.doMock("@/lib/player-market", () => ({ searchMarketPlayers: search }));
  const { GET } = await import("@/app/api/leagues/[leagueId]/players/route");
  return { GET, search };
}

function context(leagueId: string) {
  return { params: Promise.resolve({ leagueId }) };
}

describe("GET /api/leagues/[leagueId]/players", () => {
  it("rejects an invalid league ID without searching", async () => {
    const { GET, search } = await getRoute();

    const response = await GET(request("quarterbacks"), context("bad/league"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid league id." });
    expect(search).not.toHaveBeenCalled();
  });

  it.each([undefined, "   "]) ("rejects a missing or empty query without searching", async (query) => {
    const { GET, search } = await getRoute();

    const response = await GET(request(query), context("league-1"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Enter a valid player name." });
    expect(search).not.toHaveBeenCalled();
  });

  it("rejects a query longer than 80 characters without searching", async () => {
    const { GET, search } = await getRoute();

    const response = await GET(request("a".repeat(81)), context("league-1"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Enter a valid player name." });
    expect(search).not.toHaveBeenCalled();
  });

  it("searches with the exact league ID and trimmed query", async () => {
    const players = [{ id: "4984", name: "Ja'Marr Chase" }];
    const search = vi.fn().mockResolvedValue(players);
    const { GET } = await getRoute(search);

    const response = await GET(request(" Ja'Marr Chase "), context("league-1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ players });
    expect(search).toHaveBeenCalledWith("league-1", "Ja'Marr Chase");
  });

  it("maps a rejected search to the generic unavailable response", async () => {
    const search = vi.fn().mockRejectedValue(new Error("upstream details"));
    const { GET } = await getRoute(search);

    const response = await GET(request("Chase"), context("league-1"));

    expect(response.status).toBe(503);
    const payload = await response.json() as { error?: string };
    expect(payload).toEqual({ error: "Player search is unavailable right now." });
    expect(payload.error).not.toContain("upstream details");
  });

  it("rejects a caller that exceeds the search budget", async () => {
    const search = vi.fn().mockResolvedValue([]);
    const { GET } = await getRoute(search);
    const headers = { "x-forwarded-for": "203.0.113.7" };
    const send = () => GET(new Request(new URL("http://localhost/api/leagues/league-1/players?q=Chase"), { headers }), context("league-1"));

    for (let attempt = 0; attempt < 120; attempt += 1) {
      expect((await send()).status).toBe(200);
    }

    const limited = await send();
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("600");
    // The request over budget must not reach the upstream at all.
    expect(search).toHaveBeenCalledTimes(120);
  });

  it("does not spend budget on a request that fails validation", async () => {
    const search = vi.fn().mockResolvedValue([]);
    const { GET } = await getRoute(search);
    const headers = { "x-forwarded-for": "203.0.113.8" };
    const bad = () => GET(new Request(new URL("http://localhost/api/leagues/league-1/players"), { headers }), context("league-1"));

    for (let attempt = 0; attempt < 125; attempt += 1) {
      expect((await bad()).status).toBe(400);
    }

    const good = await GET(new Request(new URL("http://localhost/api/leagues/league-1/players?q=Chase"), { headers }), context("league-1"));
    expect(good.status).toBe(200);
  });
});
