import { beforeEach, describe, expect, it, vi } from "vitest";

const raFetch = vi.fn();
vi.mock("@/lib/roster-audit/client", () => ({ raFetch }));
const { getProjectedPpg } = await import("@/lib/roster-audit/endpoints");
const attribution = { text: "Values by RosterAudit.com", url: "https://rosteraudit.com" };

describe("complete offensive projection board", () => {
  beforeEach(() => { raFetch.mockReset(); });

  it("includes deep position projections that are outside the overall top 100", async () => {
    raFetch.mockImplementation(async (path: string) => {
      const url = new URL(path, "https://rosteraudit.com");
      const position = url.searchParams.get("position");
      expect(url.searchParams.get("limit")).toBe("200");
      expect(url.searchParams.get("scoring")).toBe("ppr");
      return { ok: true, attribution, data: { rankings: Array.from({ length: position === "TE" ? 65 : 1 }, (_, index) => ({ sleeper_id: `${position}${index}`, name: `${position} ${index}`, position, team: "BUF", age: 25, ppg: 15 - index / 10 })) } };
    });
    const result = await getProjectedPpg();
    if (!result.ok) throw new Error("expected ok");
    expect(raFetch).toHaveBeenCalledTimes(4);
    expect(result.data.filter(player => player.position === "TE")).toHaveLength(65);
    expect(new Set(result.data.map(player => player.position))).toEqual(new Set(["QB", "RB", "WR", "TE"]));
  });

  it("fails rather than returning an incomplete position board", async () => {
    raFetch.mockResolvedValueOnce({ ok: false, error: { kind: "rate-limited", message: "429", retryable: false } });
    raFetch.mockResolvedValue({ ok: true, attribution, data: { rankings: [] } });
    expect(await getProjectedPpg()).toMatchObject({ ok: false, error: { kind: "rate-limited" } });
    expect(raFetch).toHaveBeenCalledTimes(4);
  });
});
