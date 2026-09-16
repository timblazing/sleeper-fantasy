# Plan 005: Cover the season-phase and outlook logic in `team-insights.ts` with tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 929f986..HEAD -- src/lib/team-insights.ts`
> If the file changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as a
> STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `929f986`, 2026-09-16

## Why this matters

`src/lib/team-insights.ts` is 370 lines and has **no test file at all** — it is
the largest untested module in `src/lib`, and it changed in 4 separate commits in
the last 6 weeks. It builds the entire dashboard overview page: the letter grade,
the season phase banner, the timeline rail, and the headline metric tiles.

The logic most likely to break silently is calendar arithmetic, because it is
branch-heavy and its output is prose that looks plausible even when it is wrong:

- `buildPhase` picks one of six phases from week-vs-deadline comparisons,
  including a `week >= deadline - 2` window boundary.
- `championshipWeek` derives playoff round count via
  `Math.ceil(Math.log2(playoffTeams))`, which is off-by-one-prone at 4, 6 and 8
  teams — the three most common league sizes.
- Three settings fallbacks (`|| 13`, `|| 15`, `|| 6`) treat a legitimate `0` the
  same as a missing value.

After this plan those functions have direct unit coverage, so a future edit to
the phase or timeline logic fails a test instead of quietly mislabeling everyone's
season.

**This plan adds tests only. It does not change any behavior.** The one
production edit is widening the export list so the tests can reach the pure
functions.

## Current state

- `src/lib/team-insights.ts` — the module under test. No `team-insights.test.ts`
  exists; you are creating it.

The functions to cover are currently **module-private** (declared with plain
`function`, not exported). Here they are exactly as they exist today:

`src/lib/team-insights.ts:261-268`
```ts
const deadlineWeek = (league: LeagueValueContext["league"]) => league.settings.trade_deadline || 13;
const playoffWeek = (league: LeagueValueContext["league"]) => league.settings.playoff_week_start || 15;

function championshipWeek(league: LeagueValueContext["league"]): number {
  const playoffTeams = league.settings.playoff_teams || 6;
  const rounds = Math.max(1, Math.ceil(Math.log2(Math.max(2, playoffTeams))));
  return playoffWeek(league) + rounds - 1;
}
```

`src/lib/team-insights.ts:270-282`
```ts
/** What the calendar says you should be doing right now. */
function buildPhase(context: LeagueValueContext): SeasonPhase {
  const { week, league } = context;
  const deadline = deadlineWeek(league);
  const playoffs = playoffWeek(league);

  if (context.state.season_type === "off") return { label: "Offseason", tone: "neutral", detail: "Rookie draft prep and value shopping. Nothing is locked, so this is the cheapest time to reshape the roster." };
  if (!context.regularSeason) return { label: "Pre-season", tone: "warning", detail: "Lineup tweaks, ADP-aware moves, and identifying breakout candidates before they spike." };
  if (week >= playoffs) return { label: "Playoffs", tone: "critical", detail: "Win or go home. Start the highest floor you have and check inactives every week." };
  if (week > deadline) return { label: "Post-deadline", tone: "neutral", detail: `Trades closed after week ${deadline}. Waivers and weekly lineup calls are all that is left.` };
  if (week >= deadline - 2) return { label: "Deadline window", tone: "critical", detail: `${plural(deadline - week + 1, "week")} to buy or sell. Last chance to reshape the roster this season.` };
  return { label: "Regular season", tone: "positive", detail: "Set lineups weekly, work the waiver wire, and track buy-low windows while prices are soft." };
}
```

`src/lib/team-insights.ts:284-309`
```ts
function buildTimeline(context: LeagueValueContext): SeasonTimeline {
  const { league, week } = context;
  const phase = buildPhase(context);
  const deadline = deadlineWeek(league);
  const playoffs = playoffWeek(league);
  const title = championshipWeek(league);
  const beforeKickoff = !context.regularSeason;
  const markers: { id: string; label: string; week: number }[] = [
    ...(beforeKickoff ? [{ id: "current-phase", label: phase.label, week: 0 }] : []),
    { id: "kickoff", label: "Kickoff", week: 1 },
    { id: "deadline", label: "Trade deadline", week: deadline },
    { id: "playoffs", label: "Playoffs", week: playoffs },
    { id: "championship", label: "Championship", week: title },
  ];

  return {
    startWeek: beforeKickoff ? 0 : 1,
    endWeek: Math.max(title, week),
    currentWeek: beforeKickoff ? 0 : week,
    phase,
    markers: markers.map((marker) => ({
      ...marker,
      state: marker.week < (beforeKickoff ? 0 : week) ? "past" : marker.week === (beforeKickoff ? 0 : week) ? "now" : "upcoming",
    })),
  };
}
```

`src/lib/team-insights.ts:65-84` (`buildOutlook` — also private)
```ts
function buildOutlook(team: LeagueTeam, teams: number, week: number): TeamOutlook {
  const games = team.wins + team.losses + team.ties;
  const ppg = games ? team.pointsFor / games : 0;
  const valuePct = teams > 1 ? (teams - team.valueRank) / (teams - 1) : 0.5;
  const label = valuePct >= 0.6 ? OUTLOOK_LABELS.contender : valuePct >= 0.35 ? OUTLOOK_LABELS.bubble : OUTLOOK_LABELS.rebuild;
  const age = coreAge(team);
  const ageNote = age === null ? "" : age <= 24.5 ? " with a young core" : age >= 27 ? " on an aging core" : "";
  const recordNote = games ? `${team.wins}–${team.losses}${team.ties ? `–${team.ties}` : ""} through week ${week}` : "before kickoff";
  return { grade: letterGrade(team.valueRank, teams), label, /* ... */ };
}
```

Note `OUTLOOK_LABELS` at line 52 is
`{ contender: "Contender", bubble: "On the bubble", rebuild: "Rebuilding" }`, and
the en-dash in `recordNote` is `–` (U+2013), not a hyphen — match it exactly in
assertions.

**Test conventions to match** (this repo has strong, consistent ones):

- Test files sit next to the module: `src/lib/team-insights.test.ts`.
- Import style: `import { describe, expect, it } from "vitest";` then the module
  under test via the `@/` alias.
- Assertions are frequently one-liners:
  `it("is false for settings.type 1", () => expect(isDynastyLeague(league({ type: 1 }))).toBe(false));`
- Shared fixture factories live in `src/lib/test/fixtures.ts`. `makeLeague()`
  merges `settings` one level deep, so a test overriding `settings.trade_deadline`
  keeps the default `num_teams`.
- Read `src/lib/league-features.test.ts` before you start — it is the closest
  structural model for this plan (a small local factory + tight `describe` blocks
  per function).
- Comments in tests explain *why* a case matters, in full sentences. See the
  comment at `src/lib/league-features.test.ts:19`.

## Commands you will need

| Purpose   | Command                                   | Expected on success  |
|-----------|-------------------------------------------|----------------------|
| Typecheck | `npm run typecheck`                       | exit 0, no output    |
| Lint      | `npm run lint`                            | exit 0, no output    |
| Tests     | `npm test`                                | all pass             |
| One file  | `npm test -- src/lib/team-insights.test.ts` | all pass           |

Do not run `npm install` — dependencies are already installed.

## Scope

**In scope**:
- `src/lib/team-insights.ts` — **export-list change only** (step 1). Do not alter
  any function body, signature, or constant.
- `src/lib/team-insights.test.ts` (create)

**Out of scope** (do NOT touch, even though they look related):
- The behavior of any function in `team-insights.ts`. If a test you write reveals
  what looks like a bug — for example a `championshipWeek` off-by-one — **do not
  fix it**. Write the test to assert the *current* behavior, and note the
  suspected bug in your final report. Changing behavior and adding coverage in
  one change makes both unreviewable.
- `getOverviewData` (line 311). It calls `getLeagueValueContext(leagueId)`
  directly with no injectable source, so it cannot be unit-tested without a
  refactor. That refactor is explicitly not part of this plan.
- `buildActions`, `buildInsights`, `buildMetrics`, `buildPositionScarcity`.
  They need a fully-populated `LeagueValueContext` and a `LeagueTeam`; covering
  them is worthwhile but is a larger job than this plan. Leave them for later.
- `src/lib/test/fixtures.ts` — do not modify the shared fixtures.
- Any file under `src/components/`.

## Git workflow

- Branch: `advisor/005-team-insights-tests`
- Commit message style — sentence-case imperative, no prefix. Match the repo,
  e.g. `Support redraft leagues across the sidebar pages`.
  For this plan: `Cover season phase and outlook logic with tests`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Export the pure functions under test

In `src/lib/team-insights.ts`, add the `export` keyword to exactly these four
declarations. Change nothing else about them:

- line 261: `const deadlineWeek = ...` → `export const deadlineWeek = ...`
- line 262: `const playoffWeek = ...` → `export const playoffWeek = ...`
- line 264: `function championshipWeek(...)` → `export function championshipWeek(...)`
- line 271: `function buildPhase(...)` → `export function buildPhase(...)`
- line 284: `function buildTimeline(...)` → `export function buildTimeline(...)`
- line 66: `function buildOutlook(...)` → `export function buildOutlook(...)`

(That is six declarations — the two arrow constants plus four functions.)

Add this comment directly above the `deadlineWeek` declaration, in the repo's
voice:

```ts
// Exported for direct unit coverage: these are the calendar rules the whole overview page reads
// from, and they are pure, so they are worth testing without building a full league context.
```

**Verify**: `npm run typecheck` → exit 0. `npm test` → still all pass (421
baseline; you have not added tests yet).

### Step 2: Create the test file with a minimal context helper

Create `src/lib/team-insights.test.ts`. `buildPhase` and `buildTimeline` read
only four things from `LeagueValueContext`: `week`, `league`, `regularSeason`, and
`state.season_type`. Build a narrow helper rather than a full context — cast
through `as` because the real type is large and the functions touch none of the
rest:

```ts
import { describe, expect, it } from "vitest";
import { buildPhase, buildTimeline, championshipWeek, deadlineWeek, playoffWeek } from "@/lib/team-insights";
import type { LeagueValueContext } from "@/lib/league-values";
import { makeLeague, makeState } from "@/lib/test/fixtures";

/**
 * `buildPhase` and `buildTimeline` read only the week, the league settings, the regular-season
 * flag and the season type. Building those four rather than a whole LeagueValueContext keeps each
 * case readable and makes it obvious which inputs drive the branch under test.
 */
function context(overrides: {
  week?: number;
  settings?: Record<string, number>;
  regularSeason?: boolean;
  seasonType?: string;
} = {}): LeagueValueContext {
  return {
    week: overrides.week ?? 5,
    league: makeLeague({ settings: { num_teams: 12, ...overrides.settings } }),
    regularSeason: overrides.regularSeason ?? true,
    state: makeState({ season_type: (overrides.seasonType ?? "regular") as "regular" }),
  } as LeagueValueContext;
}
```

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Cover the settings fallbacks and `championshipWeek`

Add these `describe` blocks. Every expected value below was derived by reading
the code in "Current state" — assert current behavior.

```ts
describe("deadlineWeek and playoffWeek", () => {
  it("uses the league's configured weeks", () => {
    const league = makeLeague({ settings: { trade_deadline: 11, playoff_week_start: 14 } });
    expect(deadlineWeek(league)).toBe(11);
    expect(playoffWeek(league)).toBe(14);
  });

  it("falls back when the settings are absent", () => {
    const league = makeLeague({ settings: {} });
    expect(deadlineWeek(league)).toBe(13);
    expect(playoffWeek(league)).toBe(15);
  });

  // Documents a real quirk of the `||` fallback: a league that genuinely configured week 0
  // is indistinguishable from one that configured nothing.
  it("treats a configured 0 as unset", () => {
    const league = makeLeague({ settings: { trade_deadline: 0, playoff_week_start: 0 } });
    expect(deadlineWeek(league)).toBe(13);
    expect(playoffWeek(league)).toBe(15);
  });
});

describe("championshipWeek", () => {
  it("adds one round for a 2-team bracket", () => {
    expect(championshipWeek(makeLeague({ settings: { playoff_teams: 2, playoff_week_start: 15 } }))).toBe(15);
  });

  it("adds two rounds for a 4-team bracket", () => {
    expect(championshipWeek(makeLeague({ settings: { playoff_teams: 4, playoff_week_start: 15 } }))).toBe(16);
  });

  // 6 teams is the most common league setting: two byes plus three rounds.
  it("rounds a 6-team bracket up to three rounds", () => {
    expect(championshipWeek(makeLeague({ settings: { playoff_teams: 6, playoff_week_start: 15 } }))).toBe(17);
  });

  it("adds three rounds for an 8-team bracket", () => {
    expect(championshipWeek(makeLeague({ settings: { playoff_teams: 8, playoff_week_start: 15 } }))).toBe(17);
  });

  it("defaults to a 6-team bracket when playoff_teams is unset", () => {
    expect(championshipWeek(makeLeague({ settings: { playoff_week_start: 15 } }))).toBe(17);
  });
});
```

**Verify**: `npm test -- src/lib/team-insights.test.ts` → all pass (8 tests).

If any expected number above does not match actual behavior, **stop** — see STOP
conditions. Do not adjust the production code to match the plan.

### Step 4: Cover every `buildPhase` branch

All six branches, in the order the function checks them:

```ts
describe("buildPhase", () => {
  it("reports the offseason regardless of week", () => {
    expect(buildPhase(context({ seasonType: "off", week: 3 })).label).toBe("Offseason");
  });

  it("reports pre-season before the regular season starts", () => {
    expect(buildPhase(context({ regularSeason: false, week: 1 })).label).toBe("Pre-season");
  });

  it("reports playoffs from the playoff start week onward", () => {
    const settings = { trade_deadline: 13, playoff_week_start: 15 };
    expect(buildPhase(context({ week: 15, settings })).label).toBe("Playoffs");
    expect(buildPhase(context({ week: 17, settings })).label).toBe("Playoffs");
  });

  it("reports post-deadline between the deadline and the playoffs", () => {
    const phase = buildPhase(context({ week: 14, settings: { trade_deadline: 13, playoff_week_start: 15 } }));
    expect(phase.label).toBe("Post-deadline");
    expect(phase.detail).toContain("week 13");
  });

  // The window opens two weeks before the deadline and includes the deadline week itself.
  it("opens the deadline window three weeks out and counts down", () => {
    const settings = { trade_deadline: 13, playoff_week_start: 15 };
    expect(buildPhase(context({ week: 11, settings })).label).toBe("Deadline window");
    expect(buildPhase(context({ week: 11, settings })).detail).toContain("3 weeks");
    expect(buildPhase(context({ week: 13, settings })).detail).toContain("1 week");
  });

  it("reports the regular season before the deadline window opens", () => {
    expect(buildPhase(context({ week: 10, settings: { trade_deadline: 13, playoff_week_start: 15 } })).label).toBe("Regular season");
  });

  it("gives each phase a tone", () => {
    expect(buildPhase(context({ week: 10, settings: { trade_deadline: 13 } })).tone).toBe("positive");
    expect(buildPhase(context({ week: 15, settings: { playoff_week_start: 15 } })).tone).toBe("critical");
  });
});
```

Note the singular/plural assertion in the countdown test — it exercises the
`plural()` helper at line 55 through the `deadline - week + 1` arithmetic.

**Verify**: `npm test -- src/lib/team-insights.test.ts` → all pass (15 tests).

### Step 5: Cover `buildTimeline` marker states

```ts
describe("buildTimeline", () => {
  const settings = { trade_deadline: 13, playoff_week_start: 15, playoff_teams: 6 };

  it("marks past, current and upcoming milestones relative to the week", () => {
    const timeline = buildTimeline(context({ week: 13, settings }));
    const state = (id: string) => timeline.markers.find((marker) => marker.id === id)?.state;
    expect(state("kickoff")).toBe("past");
    expect(state("deadline")).toBe("now");
    expect(state("playoffs")).toBe("upcoming");
    expect(state("championship")).toBe("upcoming");
  });

  it("spans kickoff to the championship during the season", () => {
    const timeline = buildTimeline(context({ week: 5, settings }));
    expect(timeline.startWeek).toBe(1);
    expect(timeline.currentWeek).toBe(5);
    expect(timeline.endWeek).toBe(17);
  });

  // Before kickoff the rail starts at 0 and carries an extra marker naming the current phase,
  // so the page has something to render when no week has been played.
  it("adds a phase marker at week 0 before kickoff", () => {
    const timeline = buildTimeline(context({ week: 1, regularSeason: false, settings }));
    expect(timeline.startWeek).toBe(0);
    expect(timeline.currentWeek).toBe(0);
    expect(timeline.markers[0].id).toBe("current-phase");
    expect(timeline.markers[0].state).toBe("now");
    expect(timeline.markers.find((marker) => marker.id === "kickoff")?.state).toBe("upcoming");
  });

  it("extends endWeek when the week runs past the championship", () => {
    expect(buildTimeline(context({ week: 18, settings })).endWeek).toBe(18);
  });
});
```

**Verify**: `npm test -- src/lib/team-insights.test.ts` → all pass (19 tests).

### Step 6: Full verification

**Verify**: all three must pass:
- `npm run typecheck` → exit 0
- `npm run lint` → exit 0
- `npm test` → all pass; 19 more tests than the 421 baseline (440 total)

Then confirm you changed no behavior:
`git diff --stat src/lib/team-insights.ts` → should show only the 6 `export`
keywords and the 2 comment lines added in step 1 (roughly 8 insertions,
6 deletions; no other lines touched).

## Test plan

- New file: `src/lib/team-insights.test.ts`, 19 tests across 5 `describe` blocks.
  - `deadlineWeek` / `playoffWeek`: configured value, missing value, and the
    `0`-is-unset quirk.
  - `championshipWeek`: 2, 4, 6, 8-team brackets and the default — the
    `Math.ceil(Math.log2(...))` boundaries.
  - `buildPhase`: all six branches plus tone, including the deadline-window
    boundary and the singular/plural countdown.
  - `buildTimeline`: marker state transitions, season span, the before-kickoff
    week-0 case, and the `endWeek` clamp.
- Structural pattern: `src/lib/league-features.test.ts` (local factory helper,
  one `describe` per function, one-line `it`s where the assertion is short).
- Fixtures: `makeLeague` and `makeState` from `src/lib/test/fixtures.ts`, unchanged.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0 with 19 more passing tests than the 421 baseline
- [ ] `src/lib/team-insights.test.ts` exists and `npm test -- src/lib/team-insights.test.ts` passes
- [ ] `git diff src/lib/team-insights.ts` shows only added `export` keywords and the 2-line comment — no changed logic
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row for 005 updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any excerpt in "Current state" does not match the live code.
- **An expected value in steps 3–5 does not match actual behavior.** This is the
  most likely STOP trigger and the most important one. It means either the plan's
  arithmetic is wrong or there is a real bug. Report the function, the input, the
  expected value, and the actual value. Do **not** change `team-insights.ts` to
  make the test pass, and do **not** silently rewrite the expectation — either
  choice destroys the signal.
- Exporting a function causes a name collision or a lint error.
- You find yourself needing to build a full `LeagueValueContext` (with `teams`,
  `values`, `catalog`) to make a test pass — that means you have strayed into the
  out-of-scope functions.
- A test needs `vi.mock` or any network stubbing. These six functions are pure;
  if one appears to reach the network, the plan's premise is wrong.

## Maintenance notes

- These six functions are now part of the module's exported surface purely for
  testing. If a future refactor makes them genuinely internal again, the tests
  must move or the exports stay — do not delete the coverage to tidy the export
  list.
- The `|| 13` / `|| 15` / `|| 6` fallbacks are now pinned by the "treats a
  configured 0 as unset" test. If someone decides a configured `0` *should* be
  honored, that test is the one to update deliberately — it exists to make the
  decision explicit rather than accidental.
- Still uncovered after this plan, in rough priority order: `buildInsights`,
  `buildMetrics`, `buildActions`, `buildPositionScarcity`, and `getOverviewData`.
  The last needs source injection (like `LeagueSource` in `league-values.ts`)
  before it is testable at all.
- A reviewer should check that `git diff src/lib/team-insights.ts` contains no
  logic changes — that is the whole safety property of this plan.
