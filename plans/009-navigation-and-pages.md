# 009 — Sidebar information architecture + split the dashboard into pages

Priority P1 · Effort L · Depends on 007 (008 independent but land after to avoid conflicts).

## Why
The dashboard holds 9 panels (this week, playoff race, all-time standings, activity…).
Matchups has no nav link; Injuries hides as a tab. Several finished components are
orphaned: `HistoryChampions`, `HistoryRecords`, `SeasonTimelineCard`, `Insights`, and
`src/lib/playoff-bracket.ts` (`buildBracket`).

## Target sidebar (`src/lib/nav.ts`, `src/components/app-sidebar.tsx`)
- **League**: Dashboard (index) · Matchups (`/matchups/[week]`, show a small mono
  "WK N" badge via `SidebarMenuBadge`) · Standings (`/standings`) · Teams (`/teams`) ·
  Activity (`/activity`) · History (`/history`)
- **Players**: Rankings (`/players`) · Injuries (`/injuries`)
- **Tools**: Trade Calculator · Scouting Report · Draft Insights (unchanged)
- Footer: Resources, NavUser (unchanged position).
Active state must work for nested routes (e.g. `/teams/3` highlights Teams, `/matchups/6`
highlights Matchups). Update `navTitle()`/`AppBreadcrumb` for every new segment. League
switching keeps the current segment (existing `suffix` logic — extend it for the new
segments; matchups keeps resetting week).

## Pages (each: `PageContainer` + `PageHeader` + `loading.tsx` skeleton + `metadata.title`)
1. **Standings** `/[leagueId]/standings`: full standings table (record, PF, PA, power rank —
   reuse what `PlayoffRace`/`team-insights` already compute), `PlayoffRace` panel, and the
   playoff bracket via `buildBracket` when Sleeper has a bracket (render winners and losers
   brackets; hide gracefully pre-playoffs). Check how bracket data is fetched in
   `src/lib/sleeper.ts`; add a fetcher if missing (with the existing fetch timeout pattern).
2. **Teams** `/[leagueId]/teams`: grid of team cards (avatar, name, manager, record, value
   rank) linking to existing `/teams/[rosterId]`. Note the `@modal/(.)teams/[rosterId]`
   intercepting route must keep working from this page.
3. **Activity** `/[leagueId]/activity`: full transaction feed using `getTransactionFeed`
   (larger limit, e.g. 100) with filter tabs All / Trades / Adds / Drops (`transactionKind`),
   filter in the URL (`?type=`). Reuse `RecentActivityCard` row rendering if possible.
4. **History** `/[leagueId]/history`: `HistoryLeaderboard`, `HistoryChampions`,
   `HistoryRecords`, `SeasonTimelineCard` (check what data it needs) from `getLeagueHistory`.
   Empty state when there's no past season.
5. **Injuries** `/[leagueId]/injuries`: currently a redirect + a tab on Players. Make it a
   real page rendering the existing injury report view; remove the Rankings/Injury tabs
   from `/players` (`PlayersTabs`) and redirect `/players?view=injuries` → `/injuries`
   preserving its other query params (`injuriesHref`/`parseInjuryQuery` in
   `src/lib/injury-query.ts` — update `injuriesHref` to the new path). Update tests.
6. **Dashboard** (`src/components/overview.tsx`, `src/app/[leagueId]/page.tsx`): keep
   metrics row, current matchup, scoring, waivers, priorities, roster. Remove PlayoffRace,
   HistoryLeaderboard, RecentActivityCard; replace with compact link-outs only if layout
   needs balancing (e.g. a small "Playoff odds" mini-list linking to Standings, last 4
   activity items linking to Activity). Stop fetching `getLeagueHistory` on the dashboard if
   no longer used. Keep the two-column ROW/SIDE balance so columns end on the same line.
7. Old redirects (`league`, `scoreboard`, `draft`) stay.

## Verify
typecheck/lint/test pass (update `app-sidebar.test.tsx`, players page test, injury tests,
nav tests). Build passes. Screenshot each new page desktop + 393px phone, dark + light.
Click through every sidebar link and the league switcher; confirm active states and
breadcrumbs.
