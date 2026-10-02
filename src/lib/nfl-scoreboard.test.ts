import { describe, expect, it } from "vitest";
import { normalizeScoreboard, normalizeSummary } from "./nfl-scoreboard";

const team = (id: string, homeAway: string) => ({
  homeAway,
  team: { id, displayName: id, abbreviation: id },
  score: "0",
});
const game = {
  id: "123",
  competitions: [
    {
      date: "2026-09-27T17:00Z",
      status: { type: { state: "pre", shortDetail: "Scheduled" } },
      competitors: [team("CLE", "home"), team("CAR", "away")],
    },
  ],
};
const slate = (events: unknown[]) => ({
  season: { year: 2026, type: 2 },
  week: { number: 3 },
  events,
});

describe("NFL scoreboard normalization", () => {
  it("uses feed season/week, away-first teams, and no zero scores before kickoff", () => {
    const result = normalizeScoreboard(slate([game]));
    expect(result).toMatchObject({ season: 2026, week: 3, seasonType: 2 });
    expect(result.games[0]).toMatchObject({
      state: "upcoming",
      teams: [
        { id: "CAR", score: null },
        { id: "CLE", score: null },
      ],
    });
  });
  it("distinguishes live and final games and preserves possession and overtime", () => {
    const c = game.competitions[0];
    const result = normalizeScoreboard(
      slate([
        {
          ...game,
          competitions: [
            {
              ...c,
              status: { type: { state: "in", shortDetail: "2:00 - OT" } },
              situation: {
                possession: "CAR",
                downDistanceText: "1st & 10",
                isRedZone: true,
              },
            },
          ],
        },
      ]),
    );
    expect(result.games[0]).toMatchObject({
      state: "live",
      detail: "2:00 - OT",
      redZone: true,
      teams: [{ possession: true, score: "0" }, { possession: false }],
    });
    expect(
      normalizeScoreboard(
        slate([
          {
            ...game,
            competitions: [
              { ...c, status: { type: { state: "post", completed: true } } },
            ],
          },
        ]),
      ).games[0].state,
    ).toBe("final");
  });
  it("skips incomplete matchups and rejects invalid upstream payloads", () => {
    expect(
      normalizeScoreboard(slate([{ ...game, competitions: [] }])).games,
    ).toEqual([]);
    expect(() => normalizeScoreboard({ events: [] })).toThrow();
  });
  it("deduplicates the current drive and orders plays newest first", () => {
    const first = { id: "1", sequenceNumber: "100", text: "Kickoff" };
    const last = {
      id: "2",
      sequenceNumber: "200",
      text: "Touchdown",
      scoringPlay: true,
    };
    const result = normalizeSummary({
      header: game,
      drives: {
        previous: [{ id: "d1", plays: [first, last] }],
        current: { id: "d1", plays: [last] },
      },
    });
    expect(result.drives).toHaveLength(1);
    expect(result.drives[0].plays.map((p) => p.id)).toEqual(["2", "1"]);
    expect(result.boxscore).toBeUndefined();
  });
  it("places the live ball in away-to-home field coordinates", () => {
    const c = game.competitions[0];
    const live = (situation: object) =>
      normalizeScoreboard(
        slate([
          {
            ...game,
            competitions: [
              {
                ...c,
                status: { type: { state: "in", shortDetail: "10:24 - 3rd" } },
                situation,
              },
            ],
          },
        ]),
      ).games[0].field;
    // CAR (away) on its own 43 attacks the CLE end zone on the right.
    expect(
      live({
        possession: "CAR",
        possessionText: "CAR 43",
        down: 1,
        distance: 10,
        shortDownDistanceText: "1st & 10",
      }),
    ).toMatchObject({
      ball: 43,
      firstDown: 53,
      direction: 1,
      down: "1st & 10",
    });
    // CLE (home) at the CAR 8 on goal-to-go attacks left; falls back to yardLine.
    expect(
      live({
        possession: "CLE",
        yardLine: 92,
        down: 2,
        distance: 8,
        downDistanceText: "2nd & Goal at CAR 8",
      }),
    ).toMatchObject({ ball: 8, firstDown: 0, direction: -1 });
    expect(live({ possessionText: "CAR 43" })).toBeNull();
  });
});
