# Cloudflare Workers migration readiness

Status as of 2026-10-29, branch `perf/cloudflare-readiness`. Production still runs
as a Docker container on Hostinger behind a Cloudflare tunnel; nothing here changes
hosting. The audit this answers is `docs/cloudflare-migration-audit.md` in the
homelab repo (reviewed against `2c7451b`).

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
| Player catalog TTL allowed twice-daily refetch | 24 h, matching Sleeper's once-a-day guidance | `src/lib/players.ts` |

Measured locally (production build, `next start`, RosterAudit disabled on both
sides, same league): 20 warm dashboard + standings renders took **~228 ms CPU per
request on `main` vs ~66 ms on this branch**. This is a Node measurement, not
Workers telemetry.

## Still blocking migration

These need a runtime decision or Cloudflare resources, so they were left for the
migration itself.

1. **Pick the runtime adapter.** The app builds with `next build --webpack` and
   `output: "standalone"`; no Cloudflare adapter (OpenNext or vinext) is
   configured. Whichever is chosen must back Next's data cache (`fetch`
   `next.revalidate` and `unstable_cache`) with shared storage — the new
   simulation and settled-week caches depend on it. Without that, every isolate
   recomputes. Also validate cookies, intercepting routes (`@modal`),
   `next/image` (remote avatars from `sleepercdn.com`), and server-only secrets
   (`ROSTERAUDIT_API_KEY`).
2. **Player catalog and projections need shared storage.** The ~15 MB Sleeper
   player map and the weekly projection feed are too large for Next's data cache
   entry limit, so they are still held in module memory (`src/lib/memo.ts`).
   Workers isolates are short-lived, so each cold isolate re-downloads and parses
   15 MB — a CPU and memory risk on its own. Planned fix: a scheduled refresh
   (Cron Trigger) that writes a compact, versioned snapshot to R2 or KV once a
   day, with readers loading the snapshot and keeping last-good on failure.
3. **Rate limits are per process.** On Workers each isolate would have its own
   counters, so the limits above become per-isolate. Add a Cloudflare WAF
   rate-limiting rule (or the Workers Rate Limiting binding) for `/api/*`, and
   keep the in-app limiter as a second layer. The RosterAudit trade budget needs
   account-wide enforcement if the paid key must be protected strictly.
4. **ESPN sharing is per process too.** Same isolate caveat: the 15 s shared
   scoreboard read becomes one read per isolate per window. If a strict global
   ESPN request ceiling matters, move the scoreboard behind the Cache API or a
   Durable Object. Also confirm ESPN's site API answers requests from Workers IPs.
5. **Cold history/scouting still fan out.** First load of `/history` for a long
   dynasty can reach a few hundred Sleeper reads (up to 20 seasons × ~18 weeks),
   and scouting roughly 100. They are cached afterwards, but a cold render must
   fit the Workers subrequest limit for the chosen plan. Measure on a preview; if
   it does not fit, materialize per-season snapshots instead of rebuilding in one
   request.
6. **Measure on a preview before cutover.** Cold and warm dashboard, standings,
   history, scouting, trade, and live game summaries: CPU, memory, subrequests,
   upstream call counts, and errors. Set explicit CPU limits and billing alerts.

## Not changed

- No Wrangler/OpenNext config, no Cloudflare resources, no DNS or tunnel changes.
- `Dockerfile`, the GitHub image workflow and Hostinger deployment are untouched.
- The simulation count stays at 10,000; caching made reducing it unnecessary.
