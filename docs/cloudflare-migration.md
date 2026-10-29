# Cloudflare Workers migration

Since 2026-10-29, `sleeper.blasingame.dev` is served only by the `sleeper-fantasy`
Worker (Workers Paid), attached as a custom domain. Every push to `main` deploys it
(`.github/workflows/deploy.yml`). The Hostinger Docker container, its image
workflow and the tunnel hostname are gone. The audit this answers is `docs/cloudflare-migration-audit.md` in the homelab repo
(reviewed against `2c7451b`).

## Why Workers Paid

**The app runs on Workers, but not on Workers Free.** On a workers.dev preview
against the real dynasty and redraft leagues, a warm page render cost
**83–997 ms of CPU** (median ~200 ms), against a Free limit of 10 ms. After the
first few requests used up the free burst allowance, requests began failing with
`exceededCpu` (HTTP 503) at 10 ms, including trivial ones. Even a fully cached
matchups page, with 6 subrequests and no simulation, needs 83–172 ms. That cost is
React server rendering of the page itself, so no caching or snapshotting can bring
it under 10 ms without removing features. Workers Free also caps a request at 50
subrequests, and the dashboard, history and scouting pages exceeded it (57–198).
See [Measurements](#measurements).

Workers Paid ($5/month account-wide) covers this: 10,000 subrequests per request
and 30M CPU-ms/month included. The Worker caps CPU at 5 s per request
(`limits.cpu_ms`); the slowest measured render is ~1.8 s cold. At ~250 ms per page
view, 30M CPU-ms is about 120,000 page views a month.

## What changed to prepare

| Audit finding | Change | Where |
|---|---|---|
| 10,000-run Monte Carlo on every dashboard/standings render, run twice when a user is connected | Race and personal path now come from **one** simulation pass (verified to produce byte-identical odds), and the result is cached in Next's data cache keyed on its own inputs, so every viewer of a league shares one result until a week is scored or values move | `src/lib/playoff-odds.ts` (`runSimulation`, `simulateCached`) |
| Every Sleeper matchup/transaction read uncached, including finished seasons | Reads of finished seasons cache for 7 days, weeks behind the NFL's current week for 1 hour; the current week stays live. Applied to the playoff picture, dashboard pulse, history and scouting. Scouting's cross-league roster reads cache for 1 hour | `src/lib/sleeper.ts` (`settledTtl`) and callers |
| Two uncached ESPN reads per scoreboard poll, per tab, every 30 s | ESPN reads are shared in-process: 15 s while a game is live, up to 5 min otherwise (shortened to the next kickoff), 1 h for a final game summary. Current-week discovery is cached 10 min. Page-side ESPN reads (rosters, matchups, injuries) share the same way | `src/lib/nfl-scoreboard-server.ts`, `src/lib/espn.ts`, `src/lib/live-refresh.ts` |
| Browser polls every 30 s even with no live games; game dialog polls a final game forever | Polling follows game state: 30 s while live, otherwise waits until the next kickoff (max 15 min); a final game's dialog stops polling | `src/hooks/use-live-nfl.ts`, `src/components/nfl-scoreboard.tsx` |
| No fetch deadline; three retries could hang a render (plan 004) | Every server-side fetch carries a 10 s timeout, and `fetchCached` has a 15 s total budget across retries. 429s are still never retried | `src/lib/fetch-cached.ts`, `players.ts`, `projections.ts`, `roster-audit/client.ts`, `api/avatar` |
| Only the trade route was rate-limited (plan 006) | Per-route limiters on league lookup (30/10 min), player search (120), teams (60), scoreboard (240) and game summary (120). Client IP prefers `cf-connecting-ip` | `src/lib/request-rate-limit.ts`, `src/lib/client-address.ts`, `src/app/api/**` |
| Trade route depends on `node:net` | IP validation now uses zod; no `node:net` import remains | `src/lib/client-address.ts` |
| No Cloudflare adapter | OpenNext (`@opennextjs/cloudflare` 1.20.14) builds the Worker from `next build`. Next's data cache is backed by R2 | `wrangler.jsonc`, `open-next.config.ts`, `cloudflare/` |
| 15 MB player catalog and 5.8 MB projection feed held only in process memory | A GitHub Actions job writes compact, versioned snapshots to R2. On Workers, readers load the snapshot and keep the last good copy. Under Node (`next dev`) they fetch Sleeper directly | `scripts/sleeper-snapshots.mjs`, `.github/workflows/sleeper-snapshots.yml`, `src/lib/snapshot-*.ts`, `players.ts`, `projections.ts` |
| Player catalog TTL allowed twice-daily refetch | 24 h, matching Sleeper's once-a-day guidance | `src/lib/players.ts` |
| In-app rate limits become per-isolate on Workers | One zone WAF rate-limiting rule on `/api/*`, in front of the Worker | [WAF rule](#waf-rate-limiting-rule) |

Measured locally (production build, `next start`, RosterAudit disabled on both
sides, same league): 20 warm dashboard + standings renders took **~228 ms CPU per
request on `main` vs ~66 ms on this branch**. This is a Node measurement, not
Workers telemetry.

## Adapter: OpenNext, with the R2 incremental cache

The expectation was OpenNext with R2. The evidence confirms it.

| Requirement | OpenNext `@opennextjs/cloudflare` 1.20.14 | vinext 1.4.0 |
|---|---|---|
| Next 16.4.1 | Supported: peer range `>=15.5.28 <16 \|\| >=16.4.1`. Consumes the real `next build --webpack` output | Reimplements Next on Vite and does not use `next build`, so local Node and Workers would run two different builds. Peer-requires React `^19.3.1`; the app is on 19.2.8 |
| Data cache (`fetch` `next.revalidate`, `unstable_cache`) | `r2IncrementalCache` stores both in R2. Verified on the preview: 231 `.fetch` and 3 `.cache` (`unstable_cache` simulation) entries written under `incremental-cache/<buildId>/` | In-memory by default. Its Cloudflare data adapter is KV, whose free tier allows 1,000 writes a day |
| Intercepting/parallel routes (`@modal`) | Works: in a headless browser, clicking a team on `/teams` changes the URL to `/teams/1` and opens the team dialog over the grid, with no console errors | Listed as supported |
| Cookies | Works: the league layout reads `sidebar_state` and every page rendered with the account cookie set | Supported |
| `next/image` with sleepercdn.com | Not a factor: avatars render through plain `<img>` (`AvatarImage`) or the `/api/avatar` proxy, and the one `next/image` is `unoptimized`. No `IMAGES` binding needed | Partial; remote images go through `@unpic` |
| `server-only` secret `ROSTERAUDIT_API_KEY` | Read from `process.env` at request time. Set with `wrangler secret put`; the preview's trade and values pages used it | Supported |
| Maturity | Cloudflare's long-standing Next adapter. vinext's own README calls OpenNext "the safer, more proven option" | "Under active development"; not yet a drop-in for every app |

Configuration (`open-next.config.ts`): R2 incremental cache wrapped in the regional
Cache API cache (`long-lived`, `bypassTagCacheOnCacheHit`). Nothing calls
`revalidateTag` or `revalidatePath`, so entries only expire by time and there is no
tag cache. Every page is dynamic, so the in-isolate memory queue is enough and no
Durable Object is needed. `cloudflare/worker.ts` wraps the generated handler to
log one JSON line per request with its outbound subrequest count, which Workers
Logs does not report on its own.

`npm run dev` and `npm run build`/`start` still run the app on Node.
`getSnapshotBucket()` returns null outside a Worker, so Node fetches Sleeper
directly.

| Command | What it does |
|---|---|
| `npm run cf:build` | `next build` through OpenNext into `.open-next/` (7.7 MiB, 1.6 MiB gzipped) |
| `npm run cf:preview` | Build, then run the Worker locally in workerd |
| `npm run cf:deploy` | Build, then deploy the Worker and seed its cache |

## Player catalog and projections in R2

Bucket `sleeper-fantasy-cache` (WNAM), shared by both bindings:

```
incremental-cache/<buildId>/<hash>.fetch|.cache      OpenNext data cache (binding NEXT_INC_CACHE_R2_BUCKET)
snapshots/players/v1/latest.json                     pointer: { schema, version, generatedAt, shards }
snapshots/players/v1/<version>/active.json           2,766 players on an NFL team, 231 KB
snapshots/players/v1/<version>/archive.json          9,463 free agents and retired players, 807 KB
snapshots/projections/v1/<season>/<week>.json        one week, ~200–275 KB
```

- **Refresh.** `.github/workflows/sleeper-snapshots.yml` runs in GitHub Actions
  rather than as a Worker Cron Trigger, because a Cron Trigger has the same 10 ms
  CPU limit on Free. Daily (10:23 UTC) it fetches `/players/nfl` once, trims it to
  the fields `NflPlayer` renders, writes both shards, then moves the pointer. It
  keeps 7 versions and refuses to publish a feed with under 5,000 players.
  Hourly (:17) it refreshes the current and next week's projections. Past weeks
  are filled only if missing, so each keeps its last pre-game projections.
  PRs that touch the script run it with `--dry-run`. It authenticates with a
  bucket-scoped R2 token (Object Read & Write on this bucket only) through the S3
  API. GitHub secrets: `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`.
- **Format.** Rows are positional arrays rather than keyed objects: a third of
  the size, and roughly twice as fast to parse. Projections drop zero stats and
  the ADP and precomputed-total fields (`adp_*`, `pos_adp_*`,
  `pts_ppr|half_ppr|std`), none of which are league scoring categories
  (`pts_allow_*` is kept). That is lossless for `scoreProjection` and cuts a week
  from 5.8 MB to about 250 KB.
- **Readers.** On Workers `getPlayerCatalog()` reads the pointer, then both shards
  in parallel. An isolate rechecks the pointer hourly and re-reads shards only when
  the version moves. On failure the memo keeps serving the last good catalog.
  It never falls back to Sleeper's 15 MB feed inside a Worker. `getWeeklyProjections()`
  reads the week's file; a week with no snapshot shows no projections (they were
  already optional decoration). Under Node (`next dev`) both fetch Sleeper directly.
- **Parse cost in a Worker** (tail `cpuTime`, three runs, ~2 ms of request
  overhead included): active shard 6–11 ms, archive 17–25 ms, both 23–30 ms, one
  projection week 4–10 ms. The full catalog alone exceeds the Free budget, which
  is why it is sharded. Today every catalog consumer loads both shards. The
  split exists so the archive can later be loaded only for name lookups. On
  Paid, 23–30 ms once per isolate per day is negligible, so that refactor was not
  worth its blast radius here.

### R2 operations estimate (free tier: 1M Class A, 10M Class B, 10 GB a month)

| Source | Class A (writes, lists) | Class B (reads) |
|---|---|---|
| Snapshot job: hourly 2 puts + 1 list; daily 3 catalog puts, 1 prune list, ~11 projection puts | ~2,600 | 0 |
| Data cache writes: entries rewritten as they expire (settled weeks 1 h, finished seasons 7 d, simulations on input change). Generous case: both leagues browsed 16 h a day, ~40 entries per league per hour | ~38,000 | — |
| Data cache reads: one R2 get per cached fetch (dashboard ~60–90, history ~110, others 5–25) at ~100 page views a day. Regional Cache API hits on a custom domain would cut this further | — | ~150,000 |
| Snapshot reads: pointer hourly and projections every 30 min per isolate (~20 isolates), shards on each new version | — | ~45,000 |
| **Total** | **~41,000 (4% of free)** | **~195,000 (2% of free)** |

Storage: ~3.3 MB of data cache per build ID plus ~12 MB of snapshots. Each deploy
starts a new build ID prefix, so old prefixes should be expired with an R2
lifecycle rule (cutover step 4). Even 10× this traffic stays inside the free tier.

## WAF rate-limiting rule

| Field | Value |
|---|---|
| Zone | `blasingame.dev` (`5d5236e86794b0c503583b6e107770a1`), phase `http_ratelimit` entrypoint ruleset `5c930850e6cf45c392b0335b7cf8a1f5` |
| Rule ID | `f95a706e756540efa63dc3e1dad6a7a4` |
| Expression | `(http.host eq "sleeper.blasingame.dev" and starts_with(http.request.uri.path, "/api/"))` |
| Counting | per IP (`ip.src`, plus `cf.colo.id`, which every rate-limiting rule requires) |
| Threshold | 100 requests per 10 s (the only period Free allows) |
| Action | Block (HTTP 429) for 10 s (the only timeout Free allows) |

The tightest in-app limit is 30 requests per 10 minutes, and the fastest normal
pattern (player search on a 150–250 ms debounce, plus avatars) stays well below
10 requests a second, so the rule only catches floods. The in-app limiters remain
the fine-grained layer, now per isolate. Verified before the cutover, on the tunnel: home,
dashboard, standings, matchups, `/api/scoreboard`, `/api/leagues/:id/teams` and
player search all returned 200 after the rule went live. A burst of 115 cheap
requests (`/api/avatar` with an invalid id, answered without any upstream call)
got 100 × 400 then 15 × 429, and the next request 12 s later returned 200.

## Measurements

### Workers Paid (2026-10-29, before the route went live)

Same method as below, on workers.dev after the upgrade. Every request returned 200
with outcome `ok`, and there were no subrequest or Cache API errors. Cold is the
first pass after a deploy; warm is the range over two later passes.

| Page | League | Cold CPU / wall / subreq | Warm CPU / wall / subreq |
|---|---|---|---|
| Dashboard | dynasty | — | 697–1,069 ms / 1.1–1.5 s / 27 |
| Dashboard | redraft | — | 248–527 ms / 0.3–0.6 s / 23–24 |
| Standings | dynasty | 1,846 ms / 5.0 s / 29 | 90–145 ms / 0.1–0.2 s / 14 |
| Standings | redraft | 385 ms / 1.9 s / 28 | 111–495 ms / 0.2–0.7 s / 14 |
| History | dynasty | 1,293 ms / 4.4 s / 51 | 110–217 ms / 0.2–0.3 s / 7 |
| History | redraft | 913 ms / 1.0 s / 7 | 91–194 ms / 0.1–0.2 s / 7 |
| Scouting report | dynasty | 753 ms / 8.6 s / 112 | 413–549 ms / 0.7–1.1 s / 16 |
| Scouting report | redraft | 429 ms / 4.9 s / 65 | 118–155 ms / 0.2–0.3 s / 16 |
| Trade | dynasty | 488 ms / 0.9 s / 6 | 130–463 ms / 0.2–0.7 s / 5 |
| Trade | redraft | 655 ms / 0.8 s / 5 | 77–85 ms / 0.1 s / 5 |
| Matchups (wk 8) | dynasty | 88 ms / 0.2 s / 7 | 48–81 ms / 0.1–0.2 s / 6–7 |
| Matchups (wk 8) | redraft | 135 ms / 0.3 s / 7 | 67–430 ms / 0.2–0.6 s / 7 |
| Players | dynasty | 646 ms / 1.7 s / 14 | 202–259 ms / 0.4–0.9 s / 8 |
| Players | redraft | 635 ms / 0.8 s / 7 | 167–323 ms / 0.2–0.5 s / 7 |
| Game summary API | — | 71 ms / 0.2 s / 1 | 17–186 ms / 0.1–0.3 s / 1 |
| Scoreboard API | — | 273 ms / 0.6 s / 2 | 15–180 ms / 0.02–0.4 s / 0–2 |

The dashboards were measured after the other pages, so their data cache was
partly warm already. Once the cache can fill, warm history and scouting drop from
111–198 subrequests and ~10 s to 7–16 subrequests and under 1.2 s.

### Workers Free (preview)

Preview Worker `sleeper-fantasy` on `sleeper-fantasy.timothy-blasingame.workers.dev`
(Free plan, no routes), real leagues: dynasty `1388584098439639040`, redraft
`1389391504413310976`, `?username=timblazing` with the account cookie. CPU and wall
time come from `wrangler tail`. Subrequests are outbound `fetch` calls logged by
`cloudflare/worker.ts`; R2 and Cache API calls come on top. **Cold** is the first
request for that page after a deploy: empty data cache, empty memos. **Warm** is
the range over two later passes. A new isolate also pays ~150 ms of module start
(first `/api/scoreboard`: 161–196 ms). Memory is not reported per request by tail
or Workers Logs. No request hit the 128 MB limit.

| Page | League | Cold CPU / wall / subreq | Warm CPU / wall / subreq | Errors |
|---|---|---|---|---|
| Dashboard | dynasty | 741 ms / 3.96 s / 89 | 310–621 ms / 2.7–3.0 s / 57 | Over 50 subrequests every time (regional cache get/set fail); `exceededCpu` on pass 2 |
| Dashboard | redraft | 356 ms / 5.98 s / 105 | 297–843 ms / 2.8–3.2 s / 74–77 | Over 50 subrequests every time |
| Standings | dynasty | 1,444 ms / 2.66 s / 23 | 158–166 ms / 0.2–0.5 s / 14 | Cold: cache write hit the subrequest cap |
| Standings | redraft | 533 ms / 3.61 s / 31 | 240–682 ms / 0.3–1.2 s / 14–15 | Cold: cache write hit the subrequest cap |
| History | dynasty | 825 ms / 3.56 s / 123 | 194–215 ms / 2.8–3.0 s / 111–115 | "Too many subrequests" exception every time; cache never fills |
| History | redraft | 908 ms / 1.52 s / 10 | 96–123 ms / 0.14–0.16 s / 7 | — |
| Scouting report | dynasty | 234 ms / 10.1 s / 198 | 203–253 ms / 10.0 s / 198 | Over 50 subrequests every time; cache never fills |
| Scouting report | redraft | 534 ms / 11.3 s / 108 | 997 ms / 9.6 s / 123 | Over 50 subrequests; `exceededCpu` on pass 2 |
| Trade | dynasty | 885 ms / 1.52 s / 6 | 144–153 ms / 0.19–0.20 s / 5 | — |
| Trade | redraft | 64 ms / 0.12 s / 5 | killed at 10–52 ms | `exceededCpu` both passes |
| Matchups (wk 8) | dynasty | 490 ms / 0.66 s / 7 | 111–172 ms / 0.13–0.29 s / 6–7 | — |
| Matchups (wk 8) | redraft | 359 ms / 0.59 s / 7 | 83–121 ms / 0.10–0.26 s / 6–7 | — |
| Players | dynasty | 452 ms / 1.98 s / 14 | 755 ms / 1.05 s / 8 | `exceededCpu` on pass 2 |
| Players | redraft | 505 ms / 0.63 s / 7 | killed at 10–181 ms | `exceededCpu` both passes |
| Game summary API | — | 82 ms / 0.21 s / 1 | 42 ms / 0.17 s / 1 | `exceededCpu` once |
| Scoreboard API | — | 288 ms / 0.52 s / 2 | 8–48 ms / 0.01–0.29 s / 0–2 | — |

- **ESPN** answers from the Worker: `site.api.espn.com` scoreboard and summary
  reads returned the live week 8 slate.
- **Cold history and scouting do not fit Free**: 123 and 108–198 subrequests
  against a cap of 50, and 234–908 ms CPU against 10 ms. On Free, going over the
  subrequest cap also breaks the R2/Cache API calls that would cache the result,
  so these pages never warm up. Materializing per-season snapshots could get
  them under 50 subrequests, but not under 10 ms of CPU, because rendering
  alone costs more. That work was therefore not done. On Paid (10,000
  subrequests) they cache normally. Scouting's ~10 s wall time is mostly waiting
  on ~200 sequential-ish upstream reads (Workers allows 6 open connections at
  once) and could be materialized later as a speed improvement.
- **The data cache works** whenever a request stays under the cap: 234 entries
  landed in R2, and warm standings dropped from 23 to 14 subrequests. The
  remaining warm subrequests are deliberate live reads (league, rosters, users,
  current week).
- On workers.dev, Cloudflare documents functional Cache API operations only for
  custom domains, so these numbers assume no regional cache hits. The custom
  domain should do better.
- Profiling used tail `cpuTime` rather than pprof captures; the cost spreads
  across rendering every page rather than one hotspot.

## Still open

1. **ESPN sharing is per isolate.** The 15 s shared scoreboard read becomes one
   read per isolate per window. Fine at this traffic; if a strict global ceiling
   matters, put the scoreboard behind the Cache API or a Durable Object.
2. **RosterAudit trade budget is per isolate.** If the paid key must be protected
   strictly, add a Workers Rate Limiting binding keyed account-wide.
3. **Optional:** materialize scouting (and long dynasty histories) into R2 to cut
   cold wall time, and load the archive shard only for name lookups.
4. **Hostinger:** the container can be deleted there. The `hostinger` tunnel
   no longer routes any hostname; delete it with the VPS.

## Cutover (2026-10-29)

1. Upgraded the account to Workers Paid, then set `"limits": { "cpu_ms": 5000 }`
   in `wrangler.jsonc` and re-measured on workers.dev (table above).
2. Merged PR #11 and ran **Actions → Sleeper snapshots → Run workflow** from
   `main` so the scheduled snapshot job owns R2 from then on.
3. Secrets: `ROSTERAUDIT_API_KEY` is set on the Worker. Rotate with
   `npx wrangler secret put ROSTERAUDIT_API_KEY`. No other secrets are used.
4. R2 lifecycle rule on `sleeper-fantasy-cache`: `incremental-cache/` objects are
   deleted after 30 days, because each deploy writes under a new build ID and old
   ones are never read again.
5. Deployed from `main` with `npm run cf:deploy` behind a zone route, with the tunnel
   DNS record kept as a fallback, and verified every page on the real hostname.
6. Same day, made Cloudflare the only host:
   - Deleted the tunnel CNAME (`sleeper.blasingame.dev` → `hostinger` tunnel) and its
     ingress rule, and replaced the zone route with a Worker custom domain, so
     Cloudflare owns the DNS record and certificate. The WAF rule still applies.
   - Turned off the `workers.dev` URL, which the zone's WAF rule does not cover.
   - Removed the `Dockerfile`, `.dockerignore`, the GHCR image workflow and
     `output: "standalone"`.
   - Added `.github/workflows/deploy.yml`: on every push to `main` it runs
     typecheck, lint and tests, then `npm run cf:deploy`. It authenticates with
     the `CLOUDFLARE_API_TOKEN` secret, a token limited to Workers Scripts, R2 and
     Account Settings Read on the account, plus Workers Routes, DNS and Zone Read
     on `blasingame.dev`.

## Deploying and rolling back

Merge or push to `main`; the Deploy workflow ships it in a few minutes. Run it
by hand from **Actions → Deploy → Run workflow**. A failing check stops the
deploy and leaves the current version live.

Each deploy writes its data cache under a new build ID, so the first requests
after a deploy are cold (see the cold columns above).

To roll back, `npx wrangler rollback` (or dashboard → Workers & Pages →
`sleeper-fantasy` → Deployments) returns to an earlier version immediately. Then
revert the bad commit on `main` so the next deploy does not ship it again.

## Not changed

- The simulation count stays at 10,000; caching made reducing it unnecessary.
