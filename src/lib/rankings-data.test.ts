import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Attribution, RaPaged, RaPick, RaPlayerValue, RaPreset, RaResult } from "@/lib/roster-audit";
import type { RankingsQuery } from "@/lib/rankings-query";
import type { NflPlayer, SleeperLeague, SleeperRoster, SleeperUser } from "@/lib/types";

const getPlayerCatalog = vi.fn();
vi.mock("@/lib/players", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/players")>(), getPlayerCatalog }));

const getPresets = vi.fn();
const getRankings = vi.fn();
const getPicks = vi.fn();
const getMovers = vi.fn();
const getProjectedPpg = vi.fn();
const getLeague = vi.fn();
const getLeagueRosters = vi.fn();
const getLeagueUsers = vi.fn();
const getNflLeaguesForUsername = vi.fn();

vi.mock("@/lib/roster-audit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/roster-audit")>();
  return { ...actual, getPresets, getRankings, getPicks, getMovers, getProjectedPpg };
});

vi.mock("@/lib/sleeper", () => ({ getLeague, getLeagueRosters, getLeagueUsers, getNflLeaguesForUsername }));

const { getRankingsView } = await import("@/lib/rankings-data");

const ATTRIBUTION: Attribution = { text: "Values by RosterAudit.com", url: "https://rosteraudit.com" };
const ok = <T,>(data: T): RaResult<T> => ({ ok: true, data, attribution: ATTRIBUTION });

const preset = (over: Partial<RaPreset> & Pick<RaPreset, "key">): RaPreset => ({ label: over.key.toUpperCase(), formatKey: over.key.replace(/-/g, "_"), isSuperflex: over.key.startsWith("sf"), isTep: over.key.endsWith("tep"), scoringFormat: "ppr", leagueSize: 12, reliable: true, ...over });
const PRESETS = [preset({ key: "sf-ppr" }), preset({ key: "sf-ppr-tep" }), preset({ key: "1qb-ppr" }), preset({ key: "1qb-ppr-tep" })];

const league = (rosterPositions: string[]): SleeperLeague => ({ league_id: "L1", name: "Test League", season: "2026", sport: "nfl", status: "in_season", avatar: null, previous_league_id: null, roster_positions: rosterPositions, scoring_settings: { rec: 1 }, settings: { num_teams: 12, type: 2 } });
const SF_LEAGUE = league(["QB", "SUPER_FLEX", "RB", "WR", "TE"]);
const ONE_QB_LEAGUE = league(["QB", "RB", "WR", "TE"]);

const player = (id: string, name: string, value: number, over: Partial<RaPlayerValue> = {}): RaPlayerValue => ({ sleeperId: id, name, position: "RB", team: "ATL", age: 24.5, tier: 1, value, valueSf: value, value1qb: value, rankOverall: null, rankPosition: 1, trend7d: 0, trend30d: 0, photoUrl: null, yearsExp: 3, ...over });
const paged = (items: RaPlayerValue[], over: Partial<RaPaged<RaPlayerValue>> = {}): RaPaged<RaPlayerValue> => ({ items, total: items.length, page: 1, perPage: 50, totalPages: 1, preset: "sf-ppr", presetLabel: "SF PPR", ...over });
const pick = (over: Partial<RaPick> & Pick<RaPick, "id" | "label">): RaPick => ({ season: 2027, round: 1, slot: "early", valueSf: 5005, value1qb: 5005, sortOrder: 1, ...over });

const QUERY: RankingsQuery = { position: "all", search: "", sort: "value", page: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  getPlayerCatalog.mockResolvedValue(new Map());
  getLeague.mockResolvedValue(SF_LEAGUE);
  getLeagueRosters.mockResolvedValue([]);
  getLeagueUsers.mockResolvedValue([]);
  getNflLeaguesForUsername.mockResolvedValue({ userId: "u1" });
  getPresets.mockResolvedValue(ok(PRESETS));
  getRankings.mockResolvedValue(ok(paged([player("1", "Bijan Robinson", 6000), player("2", "Puka Nacua", 4000), player("3", "Tank Bigsby", 2000)])));
  getPicks.mockResolvedValue(ok([pick({ id: 1, label: "2027 Early 1st", valueSf: 3000, value1qb: 3000 })]));
  getMovers.mockResolvedValue(ok({ risers: [player("9", "Blake Corum", 746, { trend7d: 4129 })], fallers: [], updated: null }));
});

describe("getRankingsView pick merging", () => {
  it("interleaves picks into the value-sorted list at the correct rank", async () => {
    const result = await getRankingsView("L1", QUERY);
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.rows.map((row) => [row.rank, row.kind, row.value])).toEqual([
      [1, "player", 6000],
      [2, "player", 4000],
      [3, "pick", 3000],
      [4, "player", 2000],
    ]);
  });

  it("does not merge picks when sorting by age or name", async () => {
    for (const sort of ["age", "name"] as const) {
      const result = await getRankingsView("L1", { ...QUERY, sort });
      if (!result.ok) throw new Error("expected ok");
      expect(result.view.rows.every((row) => row.kind === "player")).toBe(true);
    }
    expect(getPicks).not.toHaveBeenCalled();
  });

  it("does not merge picks into a single-position tab", async () => {
    const result = await getRankingsView("L1", { ...QUERY, position: "QB" });
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.rows.every((row) => row.kind === "player")).toBe(true);
    expect(getPicks).not.toHaveBeenCalled();
  });

  it("merges picks against the complete pool and clamps a stale page", async () => {
    getRankings.mockResolvedValue(ok(paged([player("1", "A", 9000), player("2", "B", 8000)])));
    const result = await getRankingsView("L1", { ...QUERY, page: 2 });
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.rows.map(row => row.kind)).toEqual(["player", "player", "pick"]);
    expect(result.view.page).toBe(1);
    expect(result.view.total).toBe(3);
  });

  it("uses the preset-correct pick value — a 1QB league must not inherit val_sf", async () => {
    // Regression guard for rosteraudit-api-reference.md §2.8 (`sf ?? 1qb`).
    getLeague.mockResolvedValue(ONE_QB_LEAGUE);
    getPicks.mockResolvedValue(ok([pick({ id: 1, label: "2027 Early 1st", valueSf: 5005, value1qb: 3000 })]));
    const result = await getRankingsView("L1", QUERY);
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.presetKey).toBe("1qb-ppr");
    const pickRow = result.view.rows.find((row) => row.kind === "pick");
    expect(pickRow?.value).toBe(3000);
  });

  it("shows picks only, paginated locally, on the picks tab", async () => {
    getPicks.mockResolvedValue(ok([pick({ id: 1, label: "2027 Early 1st", valueSf: 5005, value1qb: 5005 }), pick({ id: 2, label: "2027 Mid 1st", valueSf: 2888, value1qb: 2888 })]));
    const result = await getRankingsView("L1", { ...QUERY, position: "picks" });
    if (!result.ok) throw new Error("expected ok");
    expect(getRankings).not.toHaveBeenCalled();
    expect(result.view.rows.map((row) => row.kind)).toEqual(["pick", "pick"]);
    expect(result.view.totalLabel).toBe("2 picks");
  });
});

describe("getRankingsView rookies tab", () => {
  const ROOKIE_QUERY: RankingsQuery = { ...QUERY, position: "rookies" };
  const mixed = [player("1", "Bijan Robinson", 6000, { yearsExp: 3 }), player("2", "Ashton Jeanty", 5000, { yearsExp: 0 }), player("3", "Tetairoa McMillan", 4000, { yearsExp: 0 }), player("4", "Unknown Guy", 3000, { yearsExp: null })];

  it("keeps only players with no NFL experience", async () => {
    getRankings.mockResolvedValue(ok(paged(mixed)));
    const result = await getRankingsView("L1", ROOKIE_QUERY);
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.rows.map((row) => (row.kind === "player" ? row.name : row.label))).toEqual(["Ashton Jeanty", "Tetairoa McMillan"]);
    expect(result.view.totalLabel).toBe("2 rookies");
  });

  // years_exp === null is an unknown, not a rookie; counting it would put veterans on the tab.
  it("excludes players whose experience is unknown", async () => {
    getRankings.mockResolvedValue(ok(paged([player("4", "Unknown Guy", 3000, { yearsExp: null })])));
    const result = await getRankingsView("L1", ROOKIE_QUERY);
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.rows).toEqual([]);
    expect(result.view.totalLabel).toBe("0 rookies");
  });

  // /rankings has no experience filter, so the tab must pull one wide page and slice locally.
  it("requests a single wide page with no position filter", async () => {
    getRankings.mockResolvedValue(ok(paged(mixed)));
    await getRankingsView("L1", ROOKIE_QUERY);
    expect(getRankings).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: 100 }));
  });

  it("never merges draft picks into the rookie list", async () => {
    getRankings.mockResolvedValue(ok(paged(mixed)));
    const result = await getRankingsView("L1", ROOKIE_QUERY);
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.rows.every((row) => row.kind === "player")).toBe(true);
  });

  it("paginates locally and ranks continuously across pages", async () => {
    const rookies = Array.from({ length: 60 }, (_, index) => player(`r${index}`, `Rookie ${index}`, 6000 - index, { yearsExp: 0 }));
    getRankings.mockResolvedValue(ok(paged(rookies)));
    const result = await getRankingsView("L1", { ...ROOKIE_QUERY, page: 2 });
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.totalPages).toBe(2);
    expect(result.view.rows).toHaveLength(10);
    expect(result.view.rows[0]).toMatchObject({ rank: 51, name: "Rookie 50" });
    expect(result.view.totalLabel).toBe("60 rookies");
  });

  it("labels a single rookie in the singular", async () => {
    getRankings.mockResolvedValue(ok(paged([player("2", "Ashton Jeanty", 5000, { yearsExp: 0 })])));
    const result = await getRankingsView("L1", ROOKIE_QUERY);
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.totalLabel).toBe("1 rookie");
  });
});

describe("getRankingsView ownership", () => {
  const rosters: SleeperRoster[] = [
    { roster_id: 1, owner_id: "u1", players: ["1"], starters: null, taxi: null, reserve: null, settings: {} },
    { roster_id: 2, owner_id: "u2", players: ["2"], starters: null, taxi: null, reserve: null, settings: {} },
  ];
  const users: SleeperUser[] = [
    { user_id: "u1", display_name: "Ada", username: "ada", avatar: null, metadata: { team_name: "Fourth & Long" } },
    { user_id: "u2", display_name: "Bo", username: "bo", avatar: null },
  ];

  it("marks the signed-in user's players isMine and others with their team name", async () => {
    getLeagueRosters.mockResolvedValue(rosters);
    getLeagueUsers.mockResolvedValue(users);
    const result = await getRankingsView("L1", { ...QUERY, username: "ada" });
    if (!result.ok) throw new Error("expected ok");
    const rows = result.view.rows.filter((row) => row.kind === "player");
    expect(rows[0].owner).toEqual({ teamName: "Fourth & Long", isMine: true });
    expect(rows[1].owner).toEqual({ teamName: "Bo", isMine: false });
    expect(rows[2].owner).toBeNull();
  });

  it("owns nothing when no username is present", async () => {
    getLeagueRosters.mockResolvedValue(rosters);
    getLeagueUsers.mockResolvedValue(users);
    const result = await getRankingsView("L1", QUERY);
    if (!result.ok) throw new Error("expected ok");
    const rows = result.view.rows.filter((row) => row.kind === "player");
    expect(rows.every((row) => !row.owner?.isMine)).toBe(true);
    expect(getNflLeaguesForUsername).not.toHaveBeenCalled();
  });
});

describe("getRankingsView movers and errors", () => {
  it("returns only trend fields from /movers, never the unusable percent change", async () => {
    const result = await getRankingsView("L1", QUERY);
    if (!result.ok) throw new Error("expected ok");
    expect(Object.keys(result.view.movers?.risers[0] ?? {})).toEqual(["sleeperId", "name", "position", "team", "trend7d"]);
  });

  it("returns an error state rather than throwing when /rankings fails", async () => {
    getRankings.mockResolvedValue({ ok: false, error: { kind: "rate-limited", message: "429 rate limited", retryable: false } });
    const result = await getRankingsView("L1", QUERY);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected an error state");
    expect(result.error.kind).toBe("rate-limited");
  });

  it("returns an error state rather than throwing when Sleeper is unreachable", async () => {
    getLeague.mockRejectedValue(new Error("503 upstream"));
    const result = await getRankingsView("L1", QUERY);
    if (result.ok) throw new Error("expected an error state");
    expect(result.error.kind).toBe("upstream-unavailable");
  });

  it("carries the response attribution and summarizes the league settings", async () => {
    const result = await getRankingsView("L1", QUERY);
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.attribution).toEqual(ATTRIBUTION);
    expect(result.view.leagueSummary).toBe("12T · SF · PPR");
    // The format is derived from the league, not chosen: a superflex league gets the
    // superflex preset and there is no user-facing control that could override it.
    expect(result.view.presetKey).toBe("sf-ppr");
  });
});

describe("getRankingsView for a redraft league", () => {
  const REDRAFT_LEAGUE: SleeperLeague = { ...ONE_QB_LEAGUE, settings: { num_teams: 2, type: 0 }, roster_positions: ["QB", "RB"] };

  /** Raw projected PPG, shared with roster views. */
  const BOARD = [
    { sleeperId: "rb1", name: "Alpha Back", position: "RB", team: "ATL", age: 24, ppg: 20 },
    { sleeperId: "rb2", name: "Beta Back", position: "RB", team: "BUF", age: 28, ppg: 14 },
    { sleeperId: "rb3", name: "Gamma Back", position: "RB", team: "CHI", age: 22, ppg: 11 },
    { sleeperId: "qb1", name: "Alpha Arm", position: "QB", team: "DEN", age: 30, ppg: 25 },
    { sleeperId: "qb2", name: "Beta Arm", position: "QB", team: "GB", age: 26, ppg: 19 },
  ];

  beforeEach(() => {
    getLeague.mockResolvedValue(REDRAFT_LEAGUE);
    getProjectedPpg.mockResolvedValue(ok(BOARD));
  });

  it("ranks on points per game and never touches the dynasty board", async () => {
    const result = await getRankingsView("L1", QUERY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.view.basis).toBe("redraft");
    expect(result.view.rows.map((row) => (row.kind === "player" ? [row.name, row.value] : null))).toEqual([
      ["Alpha Arm", 25], ["Alpha Back", 20], ["Beta Arm", 19], ["Beta Back", 14], ["Gamma Back", 11],
    ]);
    expect(getRankings).not.toHaveBeenCalled();
    expect(getPresets).not.toHaveBeenCalled();
  });

  it("filters by position and search against the same board", async () => {
    const byPosition = await getRankingsView("L1", { ...QUERY, position: "RB" });
    expect(byPosition.ok && byPosition.view.rows.every((row) => row.kind === "player" && row.position === "RB")).toBe(true);

    const bySearch = await getRankingsView("L1", { ...QUERY, search: "gamma" });
    expect(bySearch.ok && bySearch.view.rows.map((row) => (row.kind === "player" ? row.name : null))).toEqual(["Gamma Back"]);
  });

  // Picks and rookies have no meaning on a projection board, so those URLs fall back to the
  // full list rather than rendering an empty page.
  it("collapses the picks and rookies filters to the whole board", async () => {
    for (const position of ["picks", "rookies"] as const) {
      const result = await getRankingsView("L1", { ...QUERY, position });
      expect(result.ok && result.view.rows).toHaveLength(BOARD.length);
    }
    expect(getPicks).not.toHaveBeenCalled();
  });

  it("surfaces an upstream failure instead of an empty board", async () => {
    getProjectedPpg.mockResolvedValue({ ok: false, error: { kind: "upstream-unavailable", message: "down", retryable: true } });
    const result = await getRankingsView("L1", QUERY);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("upstream-unavailable");
  });
});

const catalogPlayer = (id: string, position: string, over: Partial<NflPlayer> = {}): NflPlayer => ({
  id, name: `Catalog ${id}`, position, team: "BUF", age: 25, yearsExp: 2,
  injuryStatus: null, injuryBodyPart: null, practiceParticipation: null, number: null,
  espnId: null, searchRank: null, depthChartOrder: null, status: "Active", ...over,
});

describe("complete player pool", () => {
  const entries = ["QB", "RB", "WR", "TE", "DEF", "K"].map(position => catalogPlayer(position, position));
  beforeEach(() => {
    getPlayerCatalog.mockResolvedValue(new Map(entries.map(player => [player.id, player])));
    getProjectedPpg.mockResolvedValue(ok([]));
  });

  it.each([0, 2])("includes unvalued offensive players and configured DEF/K for league type %s", async type => {
    getLeague.mockResolvedValue({ ...ONE_QB_LEAGUE, roster_positions: ["QB", "RB", "WR", "TE", "DEF", "K"], settings: { type } });
    getRankings.mockResolvedValue(ok(paged([])));
    const result = await getRankingsView("L1", QUERY);
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.positions).toEqual(["QB", "RB", "WR", "TE", "DEF", "K"]);
    for (const entry of entries) expect(result.view.rows).toContainEqual(expect.objectContaining({ sleeperId: entry.id, valueAvailable: false }));
    for (const position of ["DEF", "K"] as const) {
      const filtered = await getRankingsView("L1", { ...QUERY, position });
      expect(filtered.ok && filtered.view.rows).toEqual([expect.objectContaining({ sleeperId: position })]);
    }
  });

  it.each([0, 2])("omits DEF/K when the league does not use them (type %s)", async type => {
    getLeague.mockResolvedValue({ ...ONE_QB_LEAGUE, settings: { type } });
    getRankings.mockResolvedValue(ok(paged([])));
    const result = await getRankingsView("L1", { ...QUERY, sort: "name" });
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.rows).toHaveLength(4);
    expect(result.view.rows.every(row => row.kind === "player" && !["DEF", "K"].includes(row.position))).toBe(true);
  });

  it("keeps assigned injured players and excludes unassigned free agents", async () => {
    const players = [catalogPlayer("fa", "TE", { team: null }), catalogPlayer("ir", "TE", { status: "Injured Reserve" }), catalogPlayer("retired", "TE", { status: "Inactive" }), catalogPlayer("owned", "TE", { status: "Inactive" })];
    getPlayerCatalog.mockResolvedValue(new Map(players.map(player => [player.id, player])));
    getLeague.mockResolvedValue({ ...ONE_QB_LEAGUE, settings: { type: 0 } });
    getLeagueRosters.mockResolvedValue([{ roster_id: 1, owner_id: null, players: ["owned"] }]);
    const result = await getRankingsView("L1", { ...QUERY, position: "TE" });
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.rows.map(row => row.kind === "player" && row.sleeperId)).toEqual(["ir", "owned"]);
  });

  it("paginates every tight end and deduplicates projections against the catalog", async () => {
    const players = Array.from({ length: 65 }, (_, index) => catalogPlayer(`te${index}`, "TE"));
    getPlayerCatalog.mockResolvedValue(new Map(players.map(player => [player.id, player])));
    getLeague.mockResolvedValue({ ...ONE_QB_LEAGUE, settings: { type: 0 } });
    getProjectedPpg.mockResolvedValue(ok([{ sleeperId: "te0", name: "Upstream name", position: "TE", team: "BUF", age: 25, ppg: 15 }]));
    const first = await getRankingsView("L1", { ...QUERY, position: "TE" });
    const second = await getRankingsView("L1", { ...QUERY, position: "TE", page: 2 });
    if (!first.ok || !second.ok) throw new Error("expected ok");
    expect(first.view.total).toBe(65);
    expect(first.view.rows).toHaveLength(50);
    expect(first.view.rows[0]).toMatchObject({ sleeperId: "te0", valueAvailable: true });
    expect(second.view.rows).toHaveLength(15);
    expect(new Set([...first.view.rows, ...second.view.rows].map(row => row.key)).size).toBe(65);
    const search = await getRankingsView("L1", { ...QUERY, search: "Catalog te64" });
    expect(search.ok && search.view.rows).toEqual([expect.objectContaining({ sleeperId: "te64", valueAvailable: false })]);
  });

  it("loads later dynasty pages before rookie filtering", async () => {
    getPlayerCatalog.mockResolvedValue(new Map());
    getRankings.mockImplementation(({ page }) => Promise.resolve(ok(paged(page === 1 ? [player("v", "Veteran", 6000)] : [player("r", "Rookie TE", 5000, { position: "TE", yearsExp: 0 })], { page, totalPages: 2 }))));
    const result = await getRankingsView("L1", { ...QUERY, position: "rookies" });
    if (!result.ok) throw new Error("expected ok");
    expect(getRankings).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    expect(result.view.rows).toEqual([expect.objectContaining({ sleeperId: "r" })]);
  });

  it("does not silently present a partial pool when the Sleeper catalog fails", async () => {
    getPlayerCatalog.mockRejectedValue(new Error("offline"));
    const result = await getRankingsView("L1", QUERY);
    expect(result).toMatchObject({ ok: false, error: { message: "Sleeper player directory unavailable" } });
  });
});


describe("NFL team assignment is required", () => {
  it.each([0, 2])("excludes unassigned and FA rows even when rostered or present upstream (type %s)", async type => {
    getLeague.mockResolvedValue({ ...ONE_QB_LEAGUE, settings: { type } });
    const entries = [catalogPlayer("released", "TE", { team: null }), catalogPlayer("fa", "TE", { team: "FA" }), catalogPlayer("empty", "TE", { team: "" }), catalogPlayer("assigned", "TE")];
    getPlayerCatalog.mockResolvedValue(new Map(entries.map(player => [player.id, player])));
    getLeagueRosters.mockResolvedValue([{ roster_id: 1, owner_id: null, players: ["released", "fa"] }]);
    getProjectedPpg.mockResolvedValue(ok(entries.map(entry => ({ sleeperId: entry.id, name: entry.name, position: "TE", team: "BUF", age: 25, ppg: 15 }))));
    getRankings.mockResolvedValue(ok(paged(entries.map(entry => player(entry.id, entry.name, 100, { position: "TE", team: "BUF" })))));
    const result = await getRankingsView("L1", { ...QUERY, position: "TE" });
    if (!result.ok) throw new Error("expected ok");
    expect(result.view.total).toBe(1);
    expect(result.view.rows).toEqual([expect.objectContaining({ sleeperId: "assigned", team: "BUF" })]);
  });
});
