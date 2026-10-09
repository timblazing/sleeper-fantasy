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

PageContainer holds a 1600px maximum width, 28px large-desktop gutters (24px
on tablets), and 16px phone
gutters. Chrome is 60px tall; the compact footer has a top rule and 20px vertical
padding. Dashboard sections stay compact. The reference site's 96px section
spacing and large display type are editorial patterns rather than table defaults.
Controls use 8px radii, panels 12px, and pills are reserved for badges/avatars.

## Shared compositions

- `SummaryMetrics`: shared two-column phone/four-column desktop summary strip.
  Used only on the dashboard; tool pages lead directly into their workspace.
  Each card contains a Metric; labels identify the scope and currency.
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
  supported. Use for secondary details; scouting uses a shared report selected by manager buttons.
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


## Product direction and page hierarchy

The product is a decision desk for a Sleeper NFL league: prepare a lineup, find
available talent, compare roster strength, evaluate a trade, and understand the
managers and drafts behind the league. Lead with a manager's next useful action
and support it with source data. Add charts when they reveal a comparison or
pattern; avoid decorative statistics and invented recommendations.

The visual direction follows [shadcn dashboard blocks](https://ui.shadcn.com/blocks)
and [composable shadcn charts](https://ui.shadcn.com/docs/components/base/chart):
neutral surfaces, hairline borders, compact controls, restrained type, and clear
primary/secondary content. Existing Base UI primitives remain the shared controls.
Use project tokens for both themes; color communicates status, position, or a
measured gain/loss. Do not add page-specific palettes or heavy card shadows.

| View | Primary decision | Supporting context |
| --- | --- | --- |
| Dashboard | Set a healthy lineup and understand the matchup | Scoring vs league average, unrostered waiver projections, playoff odds, roster strengths and recent moves |
| Players | Compare assets using this league's value basis | Waiver watch and dynasty market movement; filters and player details |
| Injury report | Identify lineup risk | Severity filters, starter designations and status details in the rostered-player table |
| Trade Calculator | Build both sides of a deal | Staged totals, net value, live comparison and clearly labelled basis |
| Scouting Report | Find a compatible trade partner | A wrapping manager selector, roster needs, recorded trading cadence, transaction activity and draft preferences |
| Draft Insights | Compare draft outcomes against slot cost | Position/round surplus, individual pick boards and manager details |
| Matchups | Compare this week's league contests | Live points, league-scored projections and starting lineups in a dialog |
| Resources | Find relevant research | League-format filters, URL-backed search, featured sources and category anchors |
| Player/team sheets | Inspect an asset without losing league context | Flat, dense sections; player performance/history and team position rooms/roster |

At xl and wider, pair the primary board with a narrower context column (usually
2:1). Trade uses two asset panels plus a comparison rail. Matchups use two columns.
Scouting uses a wrapping row of manager buttons on desktop and a horizontally
scrollable row on phones; one shared report follows the selector. Redraft scouting
compares current projected scoring needs and complementary depth; dynasty retains
compete/rebuild windows and pick accumulation. No dynasty window labels or future
pick recommendations appear in redraft.

Phones stack in reading order; use shared responsive tabs/disclosures instead of
squeezing desktop controls. Team and player sheets share a 30rem desktop cap and
open from the bottom at 94dvh on phones. Centered dialogs retain their own width
appropriate to their content. Sheet headers/tabs stay fixed while content scrolls.

## Data and scrolling rules

- Dynasty market value, redraft PPG+, weekly projected points and actual points
  are different units. Name the unit beside the number. PPG+ preserves one decimal;
  zero is a measurement, not an unavailable value.
- Waivers exclude rostered assets and use this league's weekly scoring when
  projections exist; fallback boards name their market/PPG+ basis explicitly.
- Scoring charts use completed weeks from the current season; missing observations
  remain gaps. Scouting counts based on roster values display unavailable when the
  value feed fails. Behavioral history remains independently useful.
- Draft hit rate means current value met or beat slot value, not future NFL success.
  Class-relative fallback grades identify their benchmark.
- All native scrollbars are hidden globally, including page, sidebar, tables,
  sheets and dialogs. Keep overflow scrolling enabled. Never hide content merely
  to remove a scrollbar. Table containers are focusable with a visible focus ring;
  arrow keys, wheel/trackpad and touch remain usable. The wide game log includes a
  scrolling hint and a pinned week column.
- Resource badges describe user-relevant access and availability. Internal
  integration mechanisms do not belong in the research directory.

See [site UI audit](site-ui-audit.md) for route coverage and browser acceptance.
