# 010 — ⌘K command palette + consistency pass

Priority P2 · Effort M · Depends on 007–009.

## Steps
1. Add shadcn `command` (Base UI variant: `npx shadcn@latest add
   https://ui.shadcn.com/r/styles/base-nova/command.json`, plus `dialog` already exists).
   Inspect the generated API before use.
2. `src/components/command-menu.tsx`: opens on ⌘K / Ctrl+K and from a search button in the
   league header (`league-shell.tsx`, shows "Search… ⌘K" on md+, icon only on phones).
   Groups: Pages (every nav entry from `src/lib/nav.ts`), Teams (league rosters → team
   page), Players (search the league's player pool — reuse `/api/leagues/[leagueId]/players`
   lazily on first open; cap results), Leagues (switch league from account), Theme
   (Light/Dark/System). Preserve `?username=` on navigation (`withUsername`).
3. Consistency pass across every page: one `PageHeader` per page, `PageContainer` widths,
   panel padding (16–32px), `rounded-xl` cards, `rounded-lg` controls, tabular-nums on all
   numbers, muted supporting text, no in-flow shadows, tabs use the `Tabs` component (swap
   to `Select` on phones when they don't fit — `responsive-tabs.tsx` exists). Pages missing
   `PageHeader` today: `trade`, `scouting-report` — add one.
4. Mobile pass at 393px on every page: no horizontal overflow, tables scroll inside their
   container, header doesn't wrap awkwardly.

## Verify
typecheck/lint/test/build pass. Add a test for the command menu (opens on ⌘K, navigates).
Screenshots of each page at 1440 and 393 in both themes; fix anything off.
