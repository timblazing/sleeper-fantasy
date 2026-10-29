import { describe, expect, it } from "vitest";
import { gameRefreshMs, slateRefreshMs } from "@/lib/live-refresh";

const now = Date.parse("2026-10-25T17:00:00Z");
const timing = { liveMs: 30_000, idleMs: 15 * 60_000, now };
const at = (minutes: number) => new Date(now + minutes * 60_000).toISOString();

describe("slateRefreshMs", () => {
  it("polls at the live cadence while any game is live", () => {
    expect(slateRefreshMs([{ state: "final", kickoff: at(-200) }, { state: "live", kickoff: at(-30) }], timing)).toBe(30_000);
  });

  it("waits until the next kickoff when nothing is live", () => {
    expect(slateRefreshMs([{ state: "upcoming", kickoff: at(5) }, { state: "upcoming", kickoff: at(60) }], timing)).toBe(5 * 60_000);
  });

  it("never waits longer than the idle cadence", () => {
    expect(slateRefreshMs([{ state: "upcoming", kickoff: at(3 * 24 * 60) }], timing)).toBe(15 * 60_000);
    expect(slateRefreshMs([], timing)).toBe(15 * 60_000);
  });

  it("treats an upcoming game past its kickoff as about to go live", () => {
    expect(slateRefreshMs([{ state: "upcoming", kickoff: at(-2) }], timing)).toBe(30_000);
  });

  it("ignores unparseable kickoffs", () => {
    expect(slateRefreshMs([{ state: "upcoming", kickoff: "TBD" }], timing)).toBe(15 * 60_000);
  });
});

describe("gameRefreshMs", () => {
  it("stops once a game is final", () => {
    expect(gameRefreshMs({ state: "final", kickoff: at(-200) }, timing)).toBeNull();
  });

  it("follows the slate cadence otherwise", () => {
    expect(gameRefreshMs({ state: "live", kickoff: at(-10) }, timing)).toBe(30_000);
  });
});
