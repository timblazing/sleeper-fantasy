# Plan 006: Rate-limit the remaining public API routes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 929f986..HEAD -- src/lib/request-rate-limit.ts src/app/api/leagues/route.ts "src/app/api/leagues/[leagueId]/players/route.ts" src/app/api/roster-audit/trade/route.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `929f986`, 2026-09-16

## Why this matters

Three of this app's four API routes are public and unauthenticated. Only one of
them — `/api/roster-audit/trade` — is rate-limited. The other two each fan out to
third-party upstreams on every request:

- `GET /api/leagues?username=…` calls Sleeper's user and league endpoints.
- `GET /api/leagues/[leagueId]/players?q=…` calls `searchMarketPlayers`, which
  builds a **full league value context** (league, users, rosters, the player
  catalog, the value map) and, for dynasty leagues, additionally calls
  RosterAudit's `/movers` endpoint.

Caching absorbs repeated requests for the same league, but an attacker rotating
the `leagueId` or `username` parameter misses the cache on every single request.
That turns one cheap inbound request into several expensive upstream ones —
burning the RosterAudit API quota (a keyed, metered third-party service), and
risking the app's IP being throttled by Sleeper for everyone.

The limiter needed here already exists and is well tested
(`src/lib/request-rate-limit.ts`). This plan extends it to the two unprotected
routes with a per-route budget.

**Risk note (read before starting):** the existing limiter is a single
module-level `Map` shared by every importer. Applying it as-is to more routes
would make all routes share one 20-request budget, so a user searching players
could exhaust the trade calculator's allowance. Step 1 fixes that by making the
limiter instantiable; that refactor is the riskiest part of this plan and is why
its risk is MED rather than LOW.

## Current state

Files and their roles:

- `src/lib/request-rate-limit.ts` — the sliding-window limiter. Module-level
  state, currently a single shared instance.
- `src/app/api/roster-audit/trade/route.ts` — the one route using it today. Also
  contains the `getClientAddress` helper this plan will share.
- `src/app/api/leagues/route.ts` — public, unlimited. To protect.
- `src/app/api/leagues/[leagueId]/players/route.ts` — public, unlimited. To protect.

`src/lib/request-rate-limit.ts` in full, as it exists today:
```ts
export const REQUEST_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const REQUEST_RATE_LIMIT_MAX_REQUESTS = 20;
export const REQUEST_RATE_LIMIT_MAX_KEYS = 1024;

const requestTimestamps = new Map<string, number[]>();

function removeStaleEntries(now: number) { /* drops entries older than the window */ }
function removeOldestEntry() { /* evicts the least-recently-used key at capacity */ }

export function isRequestAllowed(requestKey: string, now = Date.now()): boolean {
  removeStaleEntries(now);
  const cutoff = now - REQUEST_RATE_LIMIT_WINDOW_MS;
  const timestamps = requestTimestamps.get(requestKey)?.filter((timestamp) => timestamp > cutoff) ?? [];
  if (timestamps.length >= REQUEST_RATE_LIMIT_MAX_REQUESTS) return false;
  if (!requestTimestamps.has(requestKey) && requestTimestamps.size >= REQUEST_RATE_LIMIT_MAX_KEYS) removeOldestEntry();
  timestamps.push(now);
  requestTimestamps.set(requestKey, timestamps);
  return true;
}

export function resetRequestRateLimitForTests() { requestTimestamps.clear(); }
```

`src/app/api/roster-audit/trade/route.ts:17-28` — the client-address helper to
reuse (note it is currently private to this file):
```ts
function getClientAddress(headers: Headers): string {
  const forwardedAddress = headers.get("x-forwarded-for")
    ?.split(",")
    .map((address) => address.trim())
    .find((address) => isIP(address) !== 0);
  if (forwardedAddress) return forwardedAddress;

  const realAddress = headers.get("x-real-ip")?.trim();
  if (realAddress && isIP(realAddress) !== 0) return realAddress;

  return "anonymous";
}
```
It imports `isIP` from `node:net` at line 1.

`src/app/api/roster-audit/trade/route.ts:52-57` — how the limiter is applied
today (the response shape to match):
```ts
  if (!isRequestAllowed(getClientAddress(request.headers))) {
    return Response.json(
      { error: "Trade calculations are temporarily limited. Try again shortly." },
      { status: 429, headers: { "retry-after": "600" } },
    );
  }
```

`src/app/api/leagues/route.ts` in full:
```ts
import { classifyLookupFailure } from "@/lib/account-lookup";
import { getNflLeaguesForUsername } from "@/lib/sleeper";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim() ?? "";
  if (!username || username.length > 50) {
    return Response.json({ error: "Enter a valid Sleeper username." }, { status: 400 });
  }

  try {
    const account = await getNflLeaguesForUsername(username);
    if (account.leagues.length === 0) {
      return Response.json({ error: `No NFL leagues were found for ${account.username} this season.` }, { status: 404 });
    }
    return Response.json(account);
  } catch (error) {
    const failure = classifyLookupFailure(error);
    return Response.json({ error: failure.error }, { status: failure.status });
  }
}
```

`src/app/api/leagues/[leagueId]/players/route.ts` in full:
```ts
import { isLeagueId } from "@/lib/league-id";
import { searchMarketPlayers } from "@/lib/player-market";

export async function GET(request: Request, context: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await context.params;
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (!isLeagueId(leagueId)) {
    return Response.json({ error: "Invalid league id." }, { status: 400 });
  }

  if (!query || query.length > 80) {
    return Response.json({ error: "Enter a valid player name." }, { status: 400 });
  }

  try {
    const players = await searchMarketPlayers(leagueId, query);
    return Response.json({ players });
  } catch {
    return Response.json({ error: "Player search is unavailable right now." }, { status: 503 });
  }
}
```

**Conventions to match:**

- Validation happens *before* the limiter in the trade route (parse first, then
  check the limit). Keep that order: a malformed request should get its 400
  without consuming budget.
- Error responses are always `Response.json({ error: "..." }, { status })` with a
  short, user-facing sentence that never leaks upstream detail.
- Route tests use `vi.doMock` + dynamic `import()` so the mock applies, with
  `afterEach(() => { vi.doUnmock(...); vi.resetModules(); })`. See
  `src/app/api/leagues/[leagueId]/players/route.test.ts:1-22`.

## Commands you will need

| Purpose   | Command                                          | Expected on success |
|-----------|--------------------------------------------------|---------------------|
| Typecheck | `npm run typecheck`                              | exit 0, no output   |
| Lint      | `npm run lint`                                   | exit 0, no output   |
| Tests     | `npm test`                                       | all pass            |
| Limiter   | `npm test -- src/lib/request-rate-limit.test.ts` | all pass            |
| Routes    | `npm test -- src/app/api`                        | all pass            |

Do not run `npm install` — dependencies are already installed.

## Scope

**In scope**:
- `src/lib/request-rate-limit.ts`
- `src/lib/request-rate-limit.test.ts`
- `src/app/api/leagues/route.ts`
- `src/app/api/leagues/route.test.ts`
- `src/app/api/leagues/[leagueId]/players/route.ts`
- `src/app/api/leagues/[leagueId]/players/route.test.ts`
- `src/app/api/roster-audit/trade/route.ts` (only to consume the refactored
  limiter and to move `getClientAddress` out — no behavior change)
- `src/lib/client-address.ts` (create)
- `src/lib/client-address.test.ts` (create)

**Out of scope** (do NOT touch, even though they look related):
- `src/app/api/avatar/route.ts` — it serves immutable, browser-cached bytes from
  a validated id with no expensive fan-out. It does not need a limiter, and
  adding one risks breaking avatar rendering across the app.
- `src/lib/player-market.ts`, `src/lib/league-values.ts`, `src/lib/sleeper.ts` —
  do not add caching, memoization, or any other change to the upstream layer.
  This plan limits inbound requests only.
- The existing limiter's window, max-requests, and max-keys *values* — reuse
  them. Do not retune.
- Introducing Redis, middleware, or any new dependency. If you believe the
  in-process limiter is insufficient, say so in your report; do not build it.
- `next.config.ts` and `src/middleware.ts` (the latter does not exist — do not
  create it).

## Git workflow

- Branch: `advisor/006-rate-limit-public-routes`
- Commit per step is preferred here, since step 1 is a refactor and steps 3–4 are
  behavior changes.
- Commit message style — sentence-case imperative, no prefix. Match the repo,
  e.g. `Bound public trade-calculation requests`.
  For this plan: `Rate-limit the remaining public API routes`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the limiter instantiable, keeping the existing API intact

Refactor `src/lib/request-rate-limit.ts` so each route gets its own independent
budget, **without** changing the exported names the trade route and the existing
tests already use.

Add a factory that owns its own `Map`, and redefine the current module-level
exports in terms of it:

```ts
export type RequestRateLimiter = {
  isAllowed(requestKey: string, now?: number): boolean;
  /** Test hook — drops all recorded request history. */
  reset(): void;
};

/**
 * Each limiter owns its own window, so one endpoint exhausting its budget cannot lock a caller
 * out of the others. Routes with different upstream costs get different allowances.
 */
export function createRequestRateLimiter(
  maxRequests = REQUEST_RATE_LIMIT_MAX_REQUESTS,
  windowMs = REQUEST_RATE_LIMIT_WINDOW_MS,
  maxKeys = REQUEST_RATE_LIMIT_MAX_KEYS,
): RequestRateLimiter { /* move the existing logic here, parameterized */ }
```

Move the bodies of `removeStaleEntries`, `removeOldestEntry` and the
`isRequestAllowed` logic inside the factory closure, replacing the three module
constants with the `maxRequests` / `windowMs` / `maxKeys` parameters and
`requestTimestamps` with the closure's own `Map`.

Then keep the existing exports as a default instance so nothing else breaks:

```ts
const defaultLimiter = createRequestRateLimiter();
export const isRequestAllowed = (requestKey: string, now = Date.now()) => defaultLimiter.isAllowed(requestKey, now);
export const resetRequestRateLimitForTests = () => defaultLimiter.reset();
```

Keep all three `REQUEST_RATE_LIMIT_*` constants exported with their current
values — the existing tests import them.

**Verify**: `npm test -- src/lib/request-rate-limit.test.ts` → **all existing
tests pass unchanged**. You must not edit that test file in this step. If a test
fails, your refactor changed behavior — fix the refactor, not the test.
Then `npm test` → 421 baseline still passes.

### Step 2: Extract `getClientAddress` into a shared module

Create `src/lib/client-address.ts` containing the `getClientAddress` function
**moved verbatim** from `src/app/api/roster-audit/trade/route.ts:17-28`, with its
`import { isIP } from "node:net";` and an `export` keyword. Add a short header
comment in the repo's voice:

```ts
/**
 * Best-effort client identity for rate limiting. Proxy headers are spoofable, so this bounds
 * casual abuse rather than a determined attacker; `anonymous` groups every unidentifiable caller
 * into one shared bucket, which fails closed.
 */
```

Then in `src/app/api/roster-audit/trade/route.ts`: delete the local
`getClientAddress` and the now-unused `node:net` import, and import it from
`@/lib/client-address` instead. Change nothing else in that file.

Create `src/lib/client-address.test.ts` covering: a single `x-forwarded-for`
value, a comma-separated list (first valid IP wins), a malformed
`x-forwarded-for` falling through to `x-real-ip`, an IPv6 address, and no headers
at all returning `"anonymous"`. Build inputs with `new Headers({ ... })`.

**Verify**: `npm run typecheck` → exit 0.
`npm test -- src/app/api/roster-audit` → all pass (trade route behavior unchanged).
`npm test -- src/lib/client-address.test.ts` → all pass (5 tests).

### Step 3: Rate-limit `/api/leagues`

In `src/app/api/leagues/route.ts`, create a route-specific limiter at module
scope and apply it after the existing username validation:

```ts
import { createRequestRateLimiter } from "@/lib/request-rate-limit";
import { getClientAddress } from "@/lib/client-address";

// A username lookup costs two Sleeper calls and is uncached for a new name, so it gets its own
// budget rather than sharing the trade calculator's.
const limiter = createRequestRateLimiter(30);
```

Apply it *after* the `username` validation block and *before* the `try`:

```ts
  if (!limiter.isAllowed(getClientAddress(request.headers))) {
    return Response.json(
      { error: "Too many lookups. Try again shortly." },
      { status: 429, headers: { "retry-after": "600" } },
    );
  }
```

**Verify**: `npm test -- src/app/api/leagues/route.test.ts` → existing tests still
pass. (They send few requests, so the limit should not trip. If an existing test
now returns 429, that is a STOP condition — report it.)

### Step 4: Rate-limit `/api/leagues/[leagueId]/players`

Same pattern in `src/app/api/leagues/[leagueId]/players/route.ts`. Apply the
check **after** both existing validation blocks (`isLeagueId` and the query
length check) and before the `try`:

```ts
// A search builds the whole league value context and, for dynasty leagues, also calls RosterAudit.
// That is the most expensive public read in the app, so its budget is the tightest.
const limiter = createRequestRateLimiter(20);
```

```ts
  if (!limiter.isAllowed(getClientAddress(request.headers))) {
    return Response.json(
      { error: "Too many searches. Try again shortly." },
      { status: 429, headers: { "retry-after": "600" } },
    );
  }
```

Note: the trade calculator's client-side search at
`src/components/trade-calculator.tsx:120` calls this endpoint on a debounced
keystroke. 20 requests per 10 minutes is the value this plan specifies — if you
find evidence the component can legitimately exceed it in normal typing, STOP and
report rather than raising the number on your own judgment.

**Verify**: `npm test -- src/app/api/leagues` → all existing tests pass.

### Step 5: Add limiter coverage to both route test files

In each of `src/app/api/leagues/route.test.ts` and
`src/app/api/leagues/[leagueId]/players/route.test.ts`, add two tests. Follow
each file's existing `getRoute()` + `vi.doMock` + `vi.resetModules()` pattern —
because `vi.resetModules()` runs in `afterEach`, each test gets a **fresh module
and therefore a fresh limiter**, which is what makes these tests isolated.

For the players route, add inside the existing `describe`:

```ts
it("rejects a caller that exceeds the search budget", async () => {
  const search = vi.fn().mockResolvedValue([]);
  const { GET } = await getRoute(search);
  const headers = { "x-forwarded-for": "203.0.113.7" };
  const send = () => GET(new Request(new URL("http://localhost/api/leagues/league-1/players?q=Chase"), { headers }), context("league-1"));

  for (let attempt = 0; attempt < 20; attempt += 1) {
    expect((await send()).status).toBe(200);
  }

  const limited = await send();
  expect(limited.status).toBe(429);
  expect(limited.headers.get("retry-after")).toBe("600");
  // The 21st request must not reach the upstream at all.
  expect(search).toHaveBeenCalledTimes(20);
});

it("does not spend budget on a request that fails validation", async () => {
  const search = vi.fn().mockResolvedValue([]);
  const { GET } = await getRoute(search);
  const headers = { "x-forwarded-for": "203.0.113.8" };
  const bad = () => GET(new Request(new URL("http://localhost/api/leagues/league-1/players"), { headers }), context("league-1"));

  for (let attempt = 0; attempt < 25; attempt += 1) {
    expect((await bad()).status).toBe(400);
  }

  const good = await GET(new Request(new URL("http://localhost/api/leagues/league-1/players?q=Chase"), { headers }), context("league-1"));
  expect(good.status).toBe(200);
});
```

You will need to extend the existing `request()` helper in each file (or inline
`new Request(url, { headers })` as above) so a test can set headers — the current
helpers do not.

Write the equivalent pair for `/api/leagues` using its 30-request budget and its
`lookup` mock.

**Verify**: `npm test -- src/app/api` → all pass, including the 4 new tests.

### Step 6: Full verification

**Verify**: all must pass:
- `npm run typecheck` → exit 0
- `npm run lint` → exit 0
- `npm test` → all pass; roughly 9 more tests than the 421 baseline (5 from
  `client-address`, 4 from the route files)
- `grep -rn "createRequestRateLimiter\|isRequestAllowed" src/app/api --include="*.ts" | grep -v "\.test\."`
  → shows a limiter in all three of `leagues/route.ts`,
  `leagues/[leagueId]/players/route.ts`, `roster-audit/trade/route.ts`

## Test plan

- `src/lib/client-address.test.ts` (new, 5 tests): single `x-forwarded-for`,
  comma-separated list, malformed value falling through to `x-real-ip`, IPv6, and
  the `"anonymous"` default.
- `src/app/api/leagues/route.test.ts` (+2): budget exhaustion returns 429 with
  `retry-after`, and a validation failure does not consume budget.
- `src/app/api/leagues/[leagueId]/players/route.test.ts` (+2): the same pair.
- `src/lib/request-rate-limit.test.ts`: **unchanged** — it is the regression gate
  proving step 1's refactor preserved behavior. Only add to it if you want extra
  coverage of `createRequestRateLimiter`'s per-instance isolation; if you do, add
  a test asserting two limiters do not share state.
- Structural pattern: `src/app/api/leagues/[leagueId]/players/route.test.ts` as
  it exists today.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0 with at least 9 more passing tests than the 421 baseline
- [ ] `src/lib/request-rate-limit.test.ts` passes **without having been modified**
      (`git diff --stat src/lib/request-rate-limit.test.ts` shows no changes,
      unless you added the optional isolation test)
- [ ] Both new routes return 429 with a `retry-after` header once their budget is
      exhausted (covered by the step 5 tests)
- [ ] `grep -rn "function getClientAddress" src/app` returns no matches (it moved to `src/lib`)
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row for 006 updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any excerpt in "Current state" does not match the live code.
- An **existing** test in `src/lib/request-rate-limit.test.ts` fails after step 1.
  That means the refactor changed limiter behavior. Do not edit that test to make
  it pass — fix the refactor or report.
- An existing route test starts returning 429 unexpectedly, which would mean the
  budget is too tight for normal use.
- You conclude the in-process limiter is inadequate because the app runs in
  multiple instances (`output: "standalone"` allows horizontal scaling, and this
  limiter is per-process). Report that as a finding — do **not** introduce Redis
  or any shared store.
- Applying the limiter appears to require Next middleware or a new dependency.
- The debounced search in `src/components/trade-calculator.tsx` can plausibly
  exceed 20 requests per 10 minutes in ordinary use. Report the evidence and your
  suggested number instead of changing it unilaterally.

## Maintenance notes

- Each route now owns a separate limiter instance, so budgets are independent.
  When adding a new public route, create a limiter sized to that route's upstream
  cost rather than reusing another route's.
- This limiter is **per process**. With `output: "standalone"` and more than one
  instance behind a load balancer, the effective limit multiplies by the instance
  count. That is an accepted tradeoff at this scale, consistent with the choice
  already made for the trade route — revisit it if the app is ever scaled out.
- `getClientAddress` trusts `x-forwarded-for`, which a client can spoof. It bounds
  casual abuse and accidental hammering, not a determined attacker. A reviewer
  should not treat this as an authentication boundary.
- A reviewer should check: validation still runs before the limiter in all three
  routes (so bad requests do not consume budget), and the 429 response shape
  matches the trade route's.
- Deliberately deferred: `/api/avatar` is left unlimited, and no upstream-side
  caching or coalescing was added. If RosterAudit quota is still a concern after
  this lands, upstream request coalescing in `player-market.ts` is the next step.
