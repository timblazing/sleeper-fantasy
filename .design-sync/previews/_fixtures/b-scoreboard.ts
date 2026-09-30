// Batch B fixtures: an ESPN-shaped NFL week for NflScoreboardPage, plus a fetch stub. The page has
// no props — it polls /api/scoreboard via useLiveNfl — so previews answer that request from here.
import type { NflScoreboard, ScoreboardGame, ScoreboardTeam } from "@/lib/nfl-scoreboard";

const logo = (abbr: string) => `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`;

const team = (id: string, name: string, abbreviation: string, record: string, score: string | null, quarters: string[] = [], over: Partial<ScoreboardTeam> = {}): ScoreboardTeam => ({
  id, name, abbreviation, logo: logo(abbreviation), score, record, winner: false, possession: false, quarters, ...over,
});

const g = (id: string, away: ScoreboardTeam, home: ScoreboardTeam, over: Partial<ScoreboardGame>): ScoreboardGame => ({
  id, name: `${away.name} at ${home.name}`, kickoff: "2026-10-04T17:00Z", state: "upcoming", detail: "Sun, October 4th at 1:00 PM EDT",
  venue: "", broadcast: "CBS", situation: "", lastPlay: "", redZone: false, teams: [away, home], ...over,
});

export const LIVE_GAMES: ScoreboardGame[] = [
  g("401772810", team("2", "Bills", "BUF", "3-0", "17", ["7", "10"], { possession: true }), team("15", "Dolphins", "MIA", "1-2", "13", ["3", "10"]),
    { state: "live", detail: "3rd Qtr 8:41", venue: "Hard Rock Stadium", broadcast: "CBS", situation: "2nd & 7 at MIA 18", redZone: true }),
  g("401772811", team("21", "Eagles", "PHI", "2-1", "24", ["7", "7", "10"]), team("6", "Cowboys", "DAL", "2-1", "20", ["3", "10", "7"], { possession: true }),
    { state: "live", detail: "4th Qtr 3:20", venue: "AT&T Stadium", broadcast: "FOX", situation: "3rd & 4 at DAL 42" }),
  g("401772812", team("26", "Seahawks", "SEA", "2-1", "10", ["3", "7"]), team("22", "Cardinals", "ARI", "1-2", "14", ["7", "7"], { possession: true }),
    { state: "live", detail: "Halftime", venue: "State Farm Stadium", broadcast: "FOX", situation: "" }),
];

export const UPCOMING_GAMES: ScoreboardGame[] = [
  g("401772813", team("4", "Bengals", "CIN", "1-2", null), team("33", "Ravens", "BAL", "2-1", null),
    { kickoff: "2026-10-04T20:25Z", detail: "Sun, October 4th at 4:25 PM EDT", venue: "M&T Bank Stadium", broadcast: "CBS" }),
  g("401772814", team("16", "Vikings", "MIN", "2-1", null), team("9", "Packers", "GB", "3-0", null),
    { kickoff: "2026-10-04T20:25Z", detail: "Sun, October 4th at 4:25 PM EDT", venue: "Lambeau Field", broadcast: "FOX" }),
  g("401772815", team("13", "Raiders", "LV", "1-2", null), team("7", "Broncos", "DEN", "2-1", null),
    { kickoff: "2026-10-06T00:15Z", detail: "Mon, October 5th at 8:15 PM EDT", venue: "Empower Field at Mile High", broadcast: "ESPN" }),
];

export const FINAL_GAMES: ScoreboardGame[] = [
  g("401772816", team("8", "Lions", "DET", "3-0", "31", ["7", "10", "7", "7"], { winner: true }), team("3", "Bears", "CHI", "0-3", "17", ["0", "10", "0", "7"]),
    { state: "final", detail: "Final", venue: "Soldier Field", broadcast: "FOX" }),
  g("401772817", team("14", "Rams", "LAR", "2-1", "27", ["3", "14", "3", "7"], { winner: true }), team("25", "49ers", "SF", "1-2", "24", ["7", "0", "10", "7"]),
    { state: "final", detail: "Final", venue: "Levi's Stadium", broadcast: "CBS" }),
  g("401772818", team("20", "Jets", "NYJ", "1-2", "20", ["7", "3", "7", "0", "3"], { winner: true }), team("17", "Patriots", "NE", "1-2", "17", ["0", "7", "3", "7", "0"]),
    { state: "final", detail: "Final/OT", venue: "Gillette Stadium", broadcast: "CBS" }),
];

const board = (games: ScoreboardGame[]): NflScoreboard => ({ season: 2026, seasonType: 2, week: 4, games, updatedAt: "2026-10-04T19:32:00Z" });

export const SCOREBOARD_SUNDAY = board([...LIVE_GAMES, ...UPCOMING_GAMES, ...FINAL_GAMES]);
export const SCOREBOARD_PREGAME = board(LIVE_GAMES.map((game) => ({ ...game, state: "upcoming" as const, detail: "Sun, October 4th at 1:00 PM EDT", situation: "", redZone: false, teams: game.teams.map((t) => ({ ...t, score: null, possession: false, quarters: [] })) })).concat(UPCOMING_GAMES));
export const SCOREBOARD_WRAPPED = board(FINAL_GAMES);
export const SCOREBOARD_EMPTY: NflScoreboard = { season: 2026, seasonType: 1, week: 0, games: [], updatedAt: "2026-08-01T16:00:00Z" };

type Reply = { body: unknown } | { status: number } | "pending";

/** Replace window.fetch so /api/scoreboard answers from a fixture (or fails / never settles). */
export function stubScoreboardFetch(reply: Reply) {
  if (typeof window === "undefined") return;
  const real = (window as unknown as { __realFetch?: typeof fetch }).__realFetch ?? window.fetch.bind(window);
  (window as unknown as { __realFetch?: typeof fetch }).__realFetch = real;
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.includes("/api/scoreboard")) return real(input, init);
    if (reply === "pending") return new Promise<Response>(() => {});
    if ("status" in reply) return Promise.resolve(new Response("{}", { status: reply.status }));
    return Promise.resolve(new Response(JSON.stringify(reply.body), { status: 200, headers: { "content-type": "application/json" } }));
  }) as typeof fetch;
}
