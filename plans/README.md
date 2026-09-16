# Implementation Plans

Plans 001–003 were generated on 2026-08-31 against commit `318cc17` and are all
DONE. Plans 004–006 were generated on 2026-09-16 against commit `929f986`.

Execute in the order below unless the dependency notes say otherwise. Each
executor must read its plan fully, honor its STOP conditions, and update the
status row when complete.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| 001 | Make malformed account cookies fail closed | P1 | S | — | DONE |
| 002 | Bound public trade-calculation requests | P1 | M | — | DONE |
| 003 | Add API route boundary coverage | P2 | M | — | DONE |
| 004 | Give every server-side outbound fetch a timeout | P1 | S | — | TODO |
| 005 | Cover season-phase and outlook logic with tests | P2 | M | — | TODO |
| 006 | Rate-limit the remaining public API routes | P2 | M | — | TODO |

Status values: TODO | IN PROGRESS | DONE | BLOCKED (with one-line reason) | REJECTED (with one-line rationale).

## Dependency notes

- 004, 005 and 006 are independent and can run in any order or in parallel.
  They touch disjoint files, with one exception below.
- 004 and 006 both touch `src/app/api/` but different routes: 004 edits only
  `avatar/route.ts` (adding a fetch timeout), 006 edits `leagues/route.ts`,
  `leagues/[leagueId]/players/route.ts` and `roster-audit/trade/route.ts`. If
  both run concurrently on separate branches, expect no conflict; if they do
  collide, land 004 first — it is the smaller change.
- 006 refactors `src/lib/request-rate-limit.ts` (built by plan 002). Its step 1
  requires plan 002's existing tests to keep passing unmodified — that is the
  regression gate for the refactor.
- 005 is tests-only and touches `src/lib/team-insights.ts` for exports alone; it
  conflicts with nothing.

## Verification baseline

At commit `929f986`, before any of 004–006: `npm run typecheck`, `npm run lint`,
and `npm test` (43 files, 421 tests) all pass cleanly. Every plan's done criteria
are stated relative to that 421-test baseline.

## Execution record

- Plan 001: approved after executor verification; commit `1ace528`.
- Plan 002: approved after executor verification and a safe retry following shared-checkout branch switching; commit `696b34d`.
- Plan 003: approved after executor verification; commit `6a26a7d`.
- Final verification on the combined 001–003 branch: `bun run typecheck`, `bun run lint`, `bun run test` (45 files, 398 tests), and `git diff --check` all passed. Lint retained six pre-existing warnings under `.agents/skills`.
- Note: the repo now uses `npm` (see `package.json` scripts and `package-lock.json`); plans 004–006 specify `npm` commands. The `.agents/skills` lint warnings no longer appear — `npm run lint` exits 0 with no output at `929f986`.

## Findings considered and rejected

From the 2026-08-31 run:

- Local `.env` credential: `.env*` is ignored and `.env` is not tracked by Git, so this was not treated as a repository leak. Rotate the RosterAudit credential if it has been shared outside the machine.
- Six lint warnings in `.agents/skills`: pre-existing unused-variable warnings in agent tooling, outside the audited hotspots. (No longer present at `929f986`.)
- Unvalidated external payload casts: plausible maintenance risk, but the quick audit was limited to high-confidence findings; no plan was created without deeper contract evidence.

From the 2026-09-16 run (each verified by reading the cited code before rejecting):

- **Division by zero in `letterGrade`** (`src/lib/league-values.ts:251`): guarded by `if (teams <= 1) return "B"` on the line directly above. Not a bug.
- **Unbounded memo key space in `projections.ts`**: `memo.ts:6-8` warns that its entries are never evicted, but the projection memo's key is `${season}:${week}` where `week` is clamped to 1–18 at `src/app/[leagueId]/matchups/[week]/page.tsx:17` and `season` comes from the league. The key space is bounded. Not a leak.
- **Trade route validates `leagueId` with zod `max(32)` rather than `isLeagueId`** (`src/app/api/roster-audit/trade/route.ts:15`): every Sleeper sink applies `encodeURIComponent` (`src/lib/sleeper.ts:13-23`), so this is defense-in-depth inconsistency, not a vulnerability. Tightening it is a one-line nit, not worth a plan.
- **Unencoded path interpolation in `getPlayerStats`** (`src/lib/roster-audit/endpoints.ts:77`): real injection *shape*, but the function has no non-test callers — the player page uses `getPlayerProfile`, which encodes correctly. Dead code. Worth deleting during unrelated cleanup; not worth a plan.
- **Sort comparators mutating caller input**: all four call sites (`roster-board.ts:38`, `player-profile.ts:106`, `injury-report.ts:117,138`) sort locally-built arrays or spread copies. No caller-owned array is mutated.
- **Rate-limiting `/api/avatar`**: serves immutable browser-cached bytes from a validated id with no expensive upstream fan-out. Explicitly out of scope in plan 006.

## Not audited in the 2026-09-16 run

The run was `quick`, so coverage was deliberately narrow. Not examined:
`src/components/` (~50 files) and `src/hooks/` beyond fetch-pattern greps, the
UI/design layer, dependency and license auditing (`npm audit` was not run), docs,
and product direction.

Separately: `AGENTS.md` referenced `docs/agents/issue-tracker.md`,
`docs/agents/triage-labels.md`, `docs/agents/domain.md`, `CONTEXT.md`, and
`docs/adr/`, none of which exist. **Fixed on 2026-09-16**: the dead pointers were
removed and `AGENTS.md` now documents only what is actually in the repo (the
issue tracker, `plans/`, and the three verification commands). The "five
canonical triage roles" section was dropped rather than rewritten — the repo
carries GitHub's default label set, so that convention was never established
here.
