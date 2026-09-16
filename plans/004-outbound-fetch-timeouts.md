# Plan 004: Give every server-side outbound fetch a timeout

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 929f986..HEAD -- src/lib/fetch-cached.ts src/lib/players.ts src/lib/projections.ts src/lib/roster-audit/client.ts src/app/api/avatar/route.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `929f986`, 2026-09-16

## Why this matters

Not one server-side `fetch` in this app passes a timeout. Every outbound call
goes to a third-party API this project does not control (Sleeper, ESPN, and
RosterAudit — the latter two undocumented). `next.config.ts` sets
`output: "standalone"` and declares no `maxDuration` anywhere in the repo, so
there is no platform-level function timeout to cut off a hung socket either.
A TCP connection that opens and then stalls without sending bytes will hang the
request indefinitely.

Two mechanisms make this worse than a single slow request. `fetchCached` retries
three times with 800ms and 1600ms backoff, so one stalled upstream multiplies.
And `src/lib/memo.ts` single-flights by key: while the Sleeper player-catalog
load is in flight, *every* concurrent reader awaits that same promise, so one
hung connection parks all of them at once with no way to abort.

After this plan, every outbound request fails fast with a clear error instead of
hanging, and the existing error paths (which already degrade gracefully) handle
it.

## Current state

Files and their roles:

- `src/lib/fetch-cached.ts` — the shared cached/retrying fetch wrapper. Used by
  all Sleeper reads and RosterAudit GETs. The fetch is at line 49.
- `src/lib/players.ts` — loads the full ~15MB Sleeper player map directly
  (too large for the Next data cache). Fetch at line 47.
- `src/lib/projections.ts` — loads the weekly Sleeper projection feed directly.
  Fetch at line 18.
- `src/lib/roster-audit/client.ts` — the RosterAudit POST path (the GET path goes
  through `fetchCached`). Fetch at line 32.
- `src/app/api/avatar/route.ts` — same-origin proxy for Sleeper avatars. Fetch at
  line 12.

Current code, exactly as it exists today:

`src/lib/fetch-cached.ts:44-50`
```ts
export async function fetchCached<T>(url: string, options: { ttl: CacheTtl; headers?: HeadersInit }): Promise<T> {
  const caching: RequestInit = options.ttl === "live" ? { cache: "no-store" } : { next: { revalidate: options.ttl } };
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "Sleeper Fantasy Dashboard/0.1", ...options.headers }, ...caching });
```

`src/lib/players.ts:46-48`
```ts
async function loadCatalog(): Promise<Map<string, NflPlayer>> {
  const response = await fetch(`${API}/players/nfl`, { cache: "no-store", headers: { "User-Agent": "Sleeper Fantasy Dashboard/0.1" } });
  if (!response.ok) throw new Error(`Sleeper player map returned ${response.status}`);
```

`src/lib/projections.ts:18-22`
```ts
  const response = await fetch(`${API}/projections/nfl/${season}/${week}?season_type=regular`, {
    cache: "no-store",
    headers: { "User-Agent": "Sleeper Fantasy Dashboard/0.1" },
  });
  if (!response.ok) throw new Error(`Sleeper projections returned ${response.status}`);
```

`src/lib/roster-audit/client.ts:32`
```ts
      const response = await fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "Sleeper Fantasy Dashboard/0.1", ...headers }, body: JSON.stringify(options.body ?? {}) });
```

`src/app/api/avatar/route.ts:12`
```ts
  const upstream = await fetch(leagueAvatarUrl(id, "thumb"));
```

**Repo conventions to match:**

- TypeScript throughout, `@/` path alias for `src/`. Server-only modules start
  with `import "server-only";`.
- Comments explain *why*, not *what*, and are written in full sentences. Most
  non-obvious decisions in this repo carry a short comment recording the
  tradeoff. Add one where you introduce a constant, in that voice.
- Style is compact: single-line function bodies and inline conditionals are
  normal here. Do not reformat surrounding code.
- Error handling already distinguishes retryable from non-retryable failures in
  `fetch-cached.ts:50-56` — do not change that logic, only add the signal.

## Commands you will need

| Purpose   | Command                                | Expected on success       |
|-----------|----------------------------------------|---------------------------|
| Typecheck | `npm run typecheck`                    | exit 0, no output         |
| Lint      | `npm run lint`                         | exit 0, no output         |
| Tests     | `npm test`                             | 43+ files, all pass       |
| One file  | `npm test -- src/lib/fetch-cached.test.ts` | all pass              |

Do not run `npm install` — dependencies are already installed.

## Scope

**In scope** (the only files you should modify):
- `src/lib/fetch-cached.ts`
- `src/lib/players.ts`
- `src/lib/projections.ts`
- `src/lib/roster-audit/client.ts`
- `src/app/api/avatar/route.ts`
- `src/lib/fetch-cached.test.ts` (add tests to the existing file)

**Out of scope** (do NOT touch, even though they look related):
- `src/lib/memo.ts` — the single-flight behavior is deliberate and documented in
  its header comment. This plan fixes the hang at the fetch layer; changing the
  memo's caching or eviction is a separate concern.
- The retry count and backoff schedule in `fetch-cached.ts:47,57` — leave both
  exactly as they are. You are adding a timeout, not retuning retries.
- Any client-side `fetch` in `src/components/` or `src/hooks/` — those already
  use `AbortController` for cancellation and run in the browser.
- `next.config.ts` — do not add `maxDuration` or other config.

## Git workflow

- Branch: `advisor/004-outbound-fetch-timeouts`
- One commit is fine for this plan, or one per step.
- Commit message style — sentence-case imperative, no prefix. Match the repo,
  e.g. `Serve live scoring data and make win probability track the week`.
  For this plan: `Give every server-side outbound fetch a timeout`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the timeout constant and apply it in `fetch-cached.ts`

In `src/lib/fetch-cached.ts`, add an exported constant near the top of the file,
below the existing `MAX_BODY_CHARS` declaration:

```ts
/**
 * Sleeper, ESPN and RosterAudit are all third-party; a stalled socket would otherwise hang a
 * render forever, because nothing above this layer imposes a deadline. Generous enough for the
 * large player and projection payloads, short enough that a wedged upstream fails fast.
 */
export const REQUEST_TIMEOUT_MS = 10_000;
```

Then add `signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)` to the `fetch` call at
line 49. Place it so a caller-supplied option cannot silently drop it — the
resulting call should read:

```ts
const response = await fetch(url, { headers: { "User-Agent": "Sleeper Fantasy Dashboard/0.1", ...options.headers }, ...caching, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
```

Note: the signal must be created *inside* the retry loop (a fresh one per
attempt), not once outside it. A single expired signal would abort every retry
instantly. Confirm your edit is inside the `for` loop body.

An aborted fetch rejects with a `DOMException` named `TimeoutError`. The existing
`catch` at line 52 already treats a non-`HttpError` rejection as retryable and
records it in `lastError`, which is the behavior we want — do not add special
handling.

**Verify**: `npm run typecheck` → exit 0, no output.

### Step 2: Apply the timeout to the four direct fetch call sites

Import the constant and add the same `signal` option to each. Each of these is a
one-line change; do not restructure the functions.

In `src/lib/players.ts`, add to the existing import block:
```ts
import { REQUEST_TIMEOUT_MS } from "@/lib/fetch-cached";
```
and change line 47 to include `signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)`
alongside the existing `cache` and `headers` options.

In `src/lib/projections.ts`, add the same import and add the `signal` property to
the options object at lines 18-21.

In `src/lib/roster-audit/client.ts`, the file already imports from
`@/lib/fetch-cached` at line 3 (`fetchCached, HttpError`) — extend that existing
import rather than adding a second one. Add the `signal` option to the POST fetch
at line 32.

In `src/app/api/avatar/route.ts`, add the import and change line 12 to:
```ts
const upstream = await fetch(leagueAvatarUrl(id, "thumb"), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
```

**Verify**: `npm run typecheck` → exit 0. Then:
`grep -rn "await fetch(" src/lib src/app | grep -v "\.test\." | grep -v REQUEST_TIMEOUT_MS`
→ must return **no lines**. (Every server-side fetch now carries the timeout.)

### Step 3: Add regression tests

Add tests to the existing `src/lib/fetch-cached.test.ts`. Follow the file's
existing structure exactly — it stubs `fetch` with `vi.stubGlobal` and inspects
`fetchMock.mock.calls[0][1]`, and it already has an
`afterEach(() => vi.unstubAllGlobals())`.

Add these two cases inside the existing `describe("fetchCached", ...)` block:

```ts
it("passes an abort signal so a stalled upstream cannot hang forever", async () => {
  const fetchMock = vi.fn().mockResolvedValue(response(200, "{}"));
  vi.stubGlobal("fetch", fetchMock);
  await fetchCached("https://x.test/k", { ttl: 60 });
  const init = fetchMock.mock.calls[0][1] as RequestInit;
  expect(init.signal).toBeInstanceOf(AbortSignal);
});

it("gives each retry attempt a fresh signal", async () => {
  const fetchMock = vi.fn().mockResolvedValue(response(503, "{}"));
  vi.stubGlobal("fetch", fetchMock);
  await fetchCached("https://x.test/l", { ttl: 60 }).catch(() => undefined);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  const signals = fetchMock.mock.calls.map((call) => (call[1] as RequestInit).signal);
  expect(new Set(signals).size).toBe(3);
});
```

The second test is the important one: it is what catches the mistake of hoisting
the signal out of the retry loop.

**Verify**: `npm test -- src/lib/fetch-cached.test.ts` → all pass, including the
2 new tests (11 total in this file).

### Step 4: Full verification

**Verify**: run all three, each must pass:
- `npm run typecheck` → exit 0
- `npm run lint` → exit 0
- `npm test` → all pass; total test count is 2 higher than before (423 if the
  baseline was 421)

## Test plan

- New tests: 2, both added to the existing `src/lib/fetch-cached.test.ts`.
  - Happy path: a successful request carries an `AbortSignal`.
  - Regression: three retry attempts receive three *distinct* signals (guards
    against hoisting the signal outside the loop, which would make retries 2 and
    3 abort instantly).
- Structural pattern to follow: the existing tests in that same file,
  particularly `"caches against Next's data cache for a numeric ttl"` at line 66,
  which shows the `mock.calls[0][1]` inspection idiom.
- No new test files are needed. The other four call sites are one-line changes
  verified by the `grep` in step 2 and by typecheck.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0, with 2 more passing tests than the 421 baseline
- [ ] `grep -rn "await fetch(" src/lib src/app | grep -v "\.test\." | grep -v REQUEST_TIMEOUT_MS` returns no matches
- [ ] `grep -n "REQUEST_TIMEOUT_MS" src/lib/fetch-cached.ts src/lib/players.ts src/lib/projections.ts src/lib/roster-audit/client.ts src/app/api/avatar/route.ts` returns a match in all five files
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row for 004 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at any location in "Current state" does not match the excerpt above.
- `AbortSignal.timeout` is unavailable or fails to typecheck. (It requires Node
  17.3+ and `lib: es2022`+. This repo targets Node 20 types, so it should be
  fine — if it is not, report rather than hand-rolling an `AbortController` with
  `setTimeout`.)
- Adding the signal to `fetch-cached.ts` breaks existing tests in
  `src/lib/fetch-cached.test.ts`. That would mean the retry/error classification
  logic interacts with abort in a way this plan did not anticipate.
- You conclude a call site needs a *different* timeout value than the shared
  constant. Report which one and why instead of inventing a second constant.
- More than two of the five call sites fail to accept the option cleanly.

## Maintenance notes

- If a new outbound `fetch` is added anywhere under `src/lib` or `src/app`, it
  must carry `signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)`. The `grep` in the
  done criteria is the check; consider it a review item on any PR adding a fetch.
- 10s is a deliberate compromise: the Sleeper player map is ~15MB and is the
  slowest legitimate request in the app. If that load starts timing out in
  production, raise the constant rather than removing the signal — and note that
  `src/lib/memo.ts` serves a stale catalog on error, so a timeout there degrades
  rather than breaks.
- A reviewer should check specifically that the signal is constructed *per
  attempt* inside the retry loop in `fetch-cached.ts`, not once above it.
- Deliberately deferred: no timeout is applied to client-side fetches in
  `src/components/` and `src/hooks/` — those already use `AbortController` for
  unmount cancellation, and a browser request that hangs affects only that tab.
