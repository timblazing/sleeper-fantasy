# Design system

Reference: [Foundations](https://components.blasingame.dev/foundations) and
[Components](https://components.blasingame.dev/components), reviewed 2026-10-06.

## Shared foundations and project extensions

`src/styles/reference/variables.css` and `DESIGN.md` are pinned copies of the
published design files. `source.json` records the URL, review date, and SHA-256
of each artifact. Builds use the checked-in snapshot; they never fetch a changing
remote theme. `npm run design:check` verifies hashes and generated system-theme
CSS offline. To deliberately update, run `npm run design:sync`, review the diff,
and inspect both themes before committing.

`src/styles/system-tokens.css` imports that palette and the generated
`system-theme.css`. Appearance follows `prefers-color-scheme` through CSS,
including first paint and live preference changes. There is no manual toggle.
Shared motion durations are 150ms for hover, 200ms for state, and 250ms for
native disclosures; reduced-motion preferences disable transitions and chart
animation. Elevation uses surfaces and borders instead of shadows.

`src/styles/fantasy-tokens.css` owns position categories, manager series, and
positive/negative aliases. Team colors may identify teams. Categorical series
belong to comparisons of several managers or positions, not single-series charts.
Shared status foreground extensions provide readable small text
in light mode while preserving the canonical accent/background colors.

## Typography and layout

`src/styles/typography.css` defines application roles:

- `type-display`: DM Sans, medium, 40–72px, tight tracking; standalone statements.
- `type-heading`: SF Pro/system UI, medium, 30–36px; compact page headings.
- `type-title`: 20px medium; cards and dialogs (16px for compact cards).
- `type-label` and `type-caption`: 12px sentence-case supporting text.
- `type-metric`: 24px medium, tabular numbers; override size for compact rows.

Body text remains 14px inside panels. Menlo is for code and measurements, not
ordinary interface labels. Sports abbreviations such as QB, PPR, and NFL keep
their conventional casing. Data uses `tabular-nums` without requiring monospace.

PageContainer holds a 1288px maximum width, 24px desktop gutters, and 16px phone
gutters. Chrome is 60px tall; the compact footer has a top rule and 20px vertical
padding. Dashboard sections stay compact. The reference site's 96px section
spacing and large display type are editorial patterns rather than table defaults.
Controls use 8px radii, panels 12px, and pills are reserved for badges/avatars/CTAs.

## Shared compositions

- `Metric`: definition-list item with label, value, detail, and optional semantic
  tone. Place inside a `dl`; used by dashboard, team, and player summaries.
- `FilterToolbar`: navigation filters plus search, active filter chips, and reset.
  Used by rankings and injuries. Links preserve URL state and username; filter
  controls are not tab-panel controls. Long filter groups scroll within the toolbar.
- `PlayerIdentity`: avatar, name/link, optional position, metadata, and badges.
  Used by rankings, injuries, rosters, and player hero. Links have visible focus.
- `PanelHeader`: title/description/actions; actions stack on phones. Used by the
  dashboard and player charts.
- `ResponsiveTabs`: controlled shared Tabs on desktop and Select on phones.
  Used by draft, player details, and scoreboard. Filter mode retains pressed-button
  semantics for scouting; hidden controls stay out of the keyboard tab order.
- `Disclosure`: native details/summary, turning plus, 250ms height/opacity where
  supported. Scouting's mobile dossiers use it; desktop selection stays compact.
- `ResponsiveDialog`: rich details use a centered desktop dialog and phone bottom
  sheet. Draft primary cells expose real keyboard buttons rather than pointer-only
  row actions.

Badge variants `success`, `warning`, `info`, and `destructive` standardize status.
Position categories remain separate. Expiring contracts and doubtful injury
statuses are warnings; unavailable players are destructive; connected/clinched
states use success; contextual updates use information.

## Charts

`src/lib/chart-style.ts` centralizes neutral series color, 12px axis text, border
grid lines, finite-value handling, number formatting, and observation summaries.
Single-series player charts use `--chart-1` and flat restrained fills. Unknown
observations remain gaps; real zero and negative scores remain measured data.
Tooltips use tabular sans text. `useChartAnimation` respects live reduced-motion
preferences. Multi-manager comparisons retain project-owned categorical colors.

## Component sources

Use shadcn/ui's Base UI variants (`base-nova`) for core controls. Inspect the
installed APIs before adapting examples. Base UI supplies behavior, focus, and
keyboard handling. Use coss ui as an additional Base UI primitive reference;
use blocks.so for compositions adapted to these tokens and APIs. mapcn is for
geographic UI when a feature actually needs a map. Keep attribution for reused
source. Do not add a second primitive library to implement an existing control.

## Specimens and verification

`/design-system` is an unindexed reference page with example data: typography,
metrics, semantic/position badges, filters, player rows, responsive tabs,
disclosure, charts, loading/empty/error surfaces, and responsive dialog.
It is independent of Sleeper and RosterAudit availability.

Run `npm run design:check`, `npm run typecheck`, `npm run lint`, `npm test`, and
`npm run build`. Browser checks cover 1440×900 and 393×852, both themes, URL
filters, tab/Select state, native disclosure, keyboard draft actions, and dialog
focus. Screenshot review and interaction tests complement each other.
