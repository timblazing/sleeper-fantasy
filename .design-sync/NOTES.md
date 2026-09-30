# design-sync notes — sleeper-fantasy-dashboard

## Shape and build
- This is a Next.js app, not a published package. `.design-sync/build.mjs` (cfg.buildCmd) builds a
  package-shaped view into gitignored `.ds-pkg/`: `dist/index.mjs` (esbuild ESM), `types/` (tsc
  declarations, `@/` aliases rewritten), `dist/styles.css` (the app's Tailwind v4 `globals.css`
  compiled against the bundle + previews + a utility safelist), and `docs/<Name>.md` (page group +
  transitive src/lib data types for each component).
- **Scope = the import closure of `src/app/[leagueId]/**`** minus `src/components/ui/*` (user
  decision: sync only custom components actually used by the league pages). build.mjs recomputes it
  every run. `connect-account-dialog` (root landing page only) and `recent-activity-card` (unused)
  are out by design.
- Converter run: `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./.ds-pkg/dist/index.mjs --out ./ds-bundle`
- React: build.mjs uses the converter's own `reactShim` (from `.ds-sync/lib/bundle.mjs`) — a plain
  `external` leaves CommonJS `require("react")` calls (recharts, base-ui deps) that throw
  "Dynamic require of react is not supported" in every preview.
- Next runtime is swapped for static shims in `.design-sync/shims/` (next/link -> <a>,
  next/navigation -> fixed demo router/params, next/image -> <img>, server-only -> no-op).
- Groups come from the `GROUPS` map in build.mjs (page-based). A component missing there gets no
  doc and lands in `general` — build.mjs prints a warning.
- `guidelinesGlob` points at a nonexistent dir on purpose: the default `docs/*.md` would sweep the
  generated `.ds-pkg/docs` stubs into `guidelines/`.

## Theme / fonts
- The app is dark-only: `<html class="dark">`, Geist + Geist Mono via next/font. `DsRoot`
  (`.design-sync/ds-root.tsx`, exported in the bundle, cfg.provider) reproduces that: `dark
  bg-background text-foreground font-sans` + `TooltipProvider`.
- Geist woff2s were copied from `.next/static/media` into `.design-sync/fonts/` (OFL) with
  `geist.css` binding `--font-sans` / `--font-mono`. Tailwind rebases the font urls relative to the
  wrapper css, so the wrapper lives in `.ds-pkg/dist/` next to the output.

## Previews
- Shared fixtures live in `.design-sync/previews/_fixtures/` (`league.ts` standings/matchups/players,
  `rankings.ts`, `stage.tsx`). Type-only `@/lib/...` imports are fine (erased); do not import app
  runtime code into previews.
- Wrap cells in `<Stage>` (p-6 inside the dark root). Don't use fixed pixel widths wider than
  ~640px — the capture cell clips them.
- Tailwind classes in previews only exist if compiled: a class not in `ds-bundle/_ds_bundle.css`
  needs a full `build.mjs` rebuild (or use inline `style`).
- Capture pins the page clock to 2024-05-15T12:00Z: compute anything relative to "now" (kickoffs,
  timestamps) from `Date.now()` at render time.
- Capture screenshots are viewport-only (not full page). Page-scale components carry viewport
  overrides in config (Overview, NflScoreboardPage, PlayerDetail, DraftWorkspace, TradeCalculator,
  TeamDetail, ScoutingReportView). ScoutingReportView's detail pane needs a >=1024px window.
- Charts: previews that draw recharts Area/Line import `./_fixtures/still-charts` (reports
  prefers-reduced-motion so charts render their final frame; recharts animates ~1.5s otherwise and
  capture freezes it mid-draw). The shim must return a plain object — MediaQueryList.matches is a
  getter and throws on assignment.
- Components that fetch their own data (NflScoreboardPage via useLiveNfl, TradeCalculator's verdict)
  are staged by stubbing `window.fetch` inside the preview; interactive states are reached by
  clicking on mount (TradeCalculator suggestions, TeamDetail Roster tab).
- Sidebar pieces (NavMain, NavProjects, NavUser, TeamSwitcher, AppSidebar) need the sidebar context;
  LeagueShell is its only source in the bundle, so `_fixtures/a-shell.ts` renders them inside a
  cropped LeagueShell. These cards use `cardMode: single` (fixed-position sidebar escapes grid cells).
- The next/navigation shim fixes the route to the index page, so AppBreadcrumb/nav always show
  "Dashboard" as active.
- NflIcon masks `url(/nfl_logo_mono.svg)` (a Next public/ asset); build.mjs inlines root-relative
  public svgs as data URIs in the bundle.
- Portals (dialogs, sheets, menus, tooltips) render into <body>: DsRoot mirrors `dark` onto
  <html> in a layout effect, as the app's layout does.
- RememberAccount renders nothing (cookie side effect) — its card is a caption.
- `.d.ts` nullability: the bundled dts.mjs parses with `strict: false`, which collapses
  `string | null` to `string`. Forked to `.design-sync/overrides/dts.mjs` with strictNullChecks on.

## Known render warns
- `[RENDER_THIN] ResponsiveDialog` — the dialog portals out of the card root, so the root measures
  0px; the screenshot shows the open dialog correctly.

## Re-sync risks
- Fonts were copied from a local `.next/static/media` build (next/font/google Geist). If the app
  changes fonts, update `.design-sync/fonts/`.
- Preview fixtures (`previews/_fixtures/*`) hand-mirror `src/lib` types. Type changes there won't
  break the build (type-only imports are erased) — a changed shape shows up as a broken or wrong card.
- The GROUPS map in build.mjs must list every new in-scope component, or it lands ungrouped.
- Previews that stub `window.fetch` depend on the current API response shapes (`/api/scoreboard`,
  `/api/roster-audit/trade`).
