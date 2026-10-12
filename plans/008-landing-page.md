# 008 — Landing page replaces the connect dialog

Priority P1 · Effort M · Depends on 007.

## Why
`/` today renders a blurred showcase dashboard behind `ConnectAccountDialog`, and the dialog
always opens `leagues[0]`, so multi-league users land in an arbitrary league.

## Target
A real landing page at `/` following the design system's landing pattern
(DESIGN: sticky 60px header with wordmark left and links right, no border until scrolled,
frosted `bg-background/80 backdrop-blur` after scroll; a viewport-filling hero with a masked
dot field — the one allowed decoration; full-bleed sections separated by edge-to-edge 1px
rules; content max 1240px; compact footer with a top rule). Display type: DM Sans 500,
tight tracking (`type-display`). Pill radius for the hero CTA/input.

Layout (approved mockup):
- Header: "Sleeper Fantasy" wordmark · links: Features (anchor), GitHub
  (https://github.com/timblazing/sleeper-fantasy) · ThemeToggle (from 007).
- Hero: small pill "Live for Week N" with a green status dot (use NFL state if cheaply
  available server-side; otherwise omit the pill). Headline "Your league, scouted."
  Sub: "Matchup forecasts, playoff odds, trade values and draft grades for any Sleeper
  league. No sign-in — just your username." Then a pill form: username input + primary
  pill button "Find my leagues →" (loading state "Finding leagues…" with spinner).
  Below: "or try a demo league" link → the showcase league (`getShowcase()` gives
  `league.id`) — link to `/${id}` without remembering an account.
- Step 2 (same page, no navigation): after lookup, a card listing every league returned
  (avatar via `leagueAvatarProxyUrl`, name, format badge, team count if available, chevron).
  Clicking one calls `rememberAccount({ leagueId, username })` and `router.push` to
  `withUsername(/${id}, username)`. If exactly one league, go straight there. Errors render
  inline under the input (`aria-live`). Enter submits; input autofocus; `autoComplete="username"`.
- Features section (id="features"): 3 columns separated by vertical hairlines (stack on
  mobile): Live matchups, Playoff race, Trade calculator — each with a small static visual
  built from tokens/series colors (no screenshots), title, one-line description.
- Footer: wordmark left; "Not affiliated with Sleeper · GitHub" right.

## Steps
1. Read `src/components/connect-account-dialog.tsx` and reuse its lookup logic (fetch
   `/api/leagues?username=`, error handling). Move it into
   `src/components/landing/connect-form.tsx` (client). Check the `/api/leagues` response
   shape for which fields exist (name, type/format, avatar, total_rosters) and use them.
2. Build `src/components/landing/*` (header, hero, features, footer) as server components
   where possible; only the form + scroll-aware header are client.
3. `src/app/page.tsx`: keep the remembered-account redirect (returning users go straight to
   their league). Support `?league=<id>` (used by the dashboard's ConnectPrompt): after
   lookup, if that league is in the list, preselect/open it. Otherwise render the landing.
   Remove the blurred `LeagueShell` backdrop.
4. Delete `connect-account-dialog.tsx` and its test; port meaningful test cases to
   `connect-form.test.tsx` (lookup success with one league redirects, multiple leagues shows
   picker, error shown, picking remembers account).
5. NavUser menu: rename the destructive item to "Switch account" (still forgets + pushes
   `/`). Update `metadata` for `/` (title "Sleeper Fantasy", good description).
6. Mobile (393px): hero headline scales down (clamp), form stays one row (button may shrink
   to icon+short label), features stack with horizontal rules.

## Verify
typecheck/lint/test pass; build passes. Screenshot `/` desktop 1440×900 and iPhone 393×852
in both themes. Manually exercise: bad username → inline error; valid username → picker →
dashboard; reload `/` → redirect to remembered league; "Switch account" → landing.
