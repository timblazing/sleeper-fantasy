# Hosting

`sleeper.blasingame.dev` runs on Vercel (Hobby plan, project `sleeper-fantasy`). The
DNS record lives in Cloudflare as a DNS-only CNAME to
`315b1c509c5b8a1c.vercel-dns-017.com` (the target Vercel recommends for this project), so
Cloudflare does not proxy the site and Vercel issues the certificate.

## Deploying

Every push to `main` deploys to production through Vercel's GitHub integration.
Pull requests get preview deployments. Vercel runs `npm run vercel-build`, which
runs typecheck, lint and tests before `next build`, so a failing check stops the
deploy and leaves the current version live.

Manual deploys: `vercel deploy --prod` from `main` (after `vercel link`).

Secrets: `ROSTERAUDIT_API_KEY` is set for Production and Preview in the project's
environment variables (`vercel env ls`). No other secrets are used.

Rollback: `vercel rollback` (or dashboard → Deployments → Promote an earlier
deployment), then revert the bad commit on `main`.

## Caching and limits

Next's data cache (`fetch` with `next.revalidate`, `unstable_cache`) is Vercel's
shared data cache, so simulations and settled Sleeper weeks are computed once and
reused across function instances. The Sleeper player map (~15 MB) and weekly
projections are trimmed and held in each function instance's memory
(`src/lib/players.ts`, `src/lib/projections.ts`), refreshed daily and every 30 minutes.

Hobby includes 4 hours of active CPU a month. Measured server renders cost
~100–700 ms of CPU each, so that covers very roughly 40,000 page views a month.
Usage: dashboard → Usage.

## Why not Cloudflare Workers

The app ran on Cloudflare Workers (OpenNext) briefly in October 2026. Measured on
Workers Free, a warm page render needed 83–997 ms of CPU against Free's 10 ms
limit, so requests failed with `exceededCpu` (503) once the burst allowance ran
out. Cold dashboard, history and scouting pages also made 57–198 outbound
requests against Free's cap of 50. Workers Paid ($5/month) ran it without errors,
but the account went back to Free, so hosting moved to Vercel Hobby. The
Cloudflare-specific pieces (Worker build, R2 snapshots, deploy workflow) were
removed. The commits are in history if that path is ever revisited.
