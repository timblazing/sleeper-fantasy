import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { GET as details } from "./[eventId]/route";
import {
  getCurrentNflScoreboard,
  getNflGameSummary,
} from "@/lib/nfl-scoreboard-server";
vi.mock("@/lib/nfl-scoreboard-server", () => ({
  getCurrentNflScoreboard: vi.fn(),
  getNflGameSummary: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
describe("NFL scoreboard routes", () => {
  it("returns scores without caching stale live data", async () => {
    vi.mocked(getCurrentNflScoreboard).mockResolvedValue({
      season: 2026,
      seasonType: 2,
      week: 3,
      games: [],
      updatedAt: "now",
    });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ week: 3 });
  });
  it("sanitizes upstream failures", async () => {
    vi.mocked(getCurrentNflScoreboard).mockRejectedValue(
      new Error("private provider details"),
    );
    const response = await GET();
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain(
      "private provider details",
    );
  });
  it("rejects invalid event IDs before an upstream request", async () => {
    const response = await details(new Request("http://localhost"), {
      params: Promise.resolve({ eventId: "123?override=1" }),
    });
    expect(response.status).toBe(400);
    expect(getNflGameSummary).not.toHaveBeenCalled();
  });
});
