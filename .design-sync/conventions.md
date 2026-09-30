# Sleeper Fantasy Dashboard: conventions

These are the real components of a dark-only fantasy football dashboard (Next.js, Tailwind v4,
shadcn/Base UI). They are data-driven: most take typed data objects (matchups, standings, player
profiles), not children.

## Setup: always wrap in `DsRoot`

`DsRoot` supplies what the app's `<html>` provides: the `dark` theme, Geist and Geist Mono, the
page background, and tooltip context. Without it, components render light and unstyled, and
tooltips throw. Mount one per tree:

```jsx
const { DsRoot, PageContainer, PageHeader } = window.SleeperDashboard;
<DsRoot>
  <PageContainer>
    <PageHeader title="Dashboard" description="This week at a glance." />
    {/* page content */}
  </PageContainer>
</DsRoot>
```

`LeagueShell` (`league: LeagueChrome`) is the full app frame: sidebar, breadcrumb and footer.
Use it for whole-app screens. `NavMain`, `NavProjects`, `NavUser` and `TeamSwitcher` only work
inside it (they need its sidebar context).

## Data props: read the types first

Each `components/<group>/<Name>/<Name>.prompt.md` ends with a **Data types** section: the full
declarations of the prop types (`MatchupDetail`, `StandingRow`, `RosterSlot`, `NflPlayer`,
`RankingsView`...). Build data that matches them exactly. Use realistic NFL players, teams and
scores. `null` fields are the documented "unknown/unavailable" state, and components render
dashes or empty states for them.

## Styling idiom: Tailwind utilities on semantic tokens

For your own layout glue, use Tailwind classes built on the theme tokens. Never use raw hex
colors or light-theme colors.

| Role | Classes |
|---|---|
| Surfaces | `bg-background`, `bg-card`, `bg-muted`, `bg-popover`, `bg-secondary` |
| Text | `text-foreground`, `text-muted-foreground`, `text-card-foreground`, `text-primary` (teal accent) |
| Borders | `border`, `border-border`, `border-input` |
| Status | `text-positive` / `bg-positive` (gains, wins), `text-negative`, `text-destructive`, `text-warning` |
| Positions | `bg-position-qb-background` + `text-position-qb-foreground` (also `rb`, `wr`, `te`); prefer the `PositionBadge` component |
| Charts | `bg-chart-1`…`bg-chart-5`, `bg-series-1`…`bg-series-8` (also `text-`, `fill-`, `stroke-`) |
| Opacity tints | `bg-primary/10`, `bg-positive/20`, `bg-negative/10`, `bg-muted/50` |

House patterns:
- Cards: `rounded-xl border bg-card p-4`.
- Every number (scores, values, ranks) is `font-mono tabular-nums`.
- Secondary labels are `text-xs text-muted-foreground`.
- Spacing is `gap-2` to `gap-6`, in `flex` or `grid grid-cols-*` with `sm:`/`md:`/`lg:` breakpoints.

Only compiled classes exist. The stylesheet holds the classes the components use, plus a safelist:
the token colors above; `flex`, `grid`, `grid-cols-1..12`/`col-span-*` (with `sm:`/`md:`/`lg:`/`xl:`);
`gap-*`, `p*-`, `m*-` and `space-*` on the 0–16 scale; `text-xs..4xl`; `font-medium/semibold/bold`;
`rounded*`; `max-w-xs..7xl`. For anything else, such as arbitrary values like `w-[37rem]`, use an
inline `style`.

## Where the truth lives

- `styles.css` → `_ds_bundle.css`: every compiled class and token (`--background`, `--primary`,
  `--positive`, `--position-*`...). Grep here before using a class.
- `<Name>.d.ts` is the prop contract. `<Name>.prompt.md` has usage, examples and data types.

## Example

```jsx
const { DsRoot, MatchupSummary, PositionBadge } = window.SleeperDashboard;
<DsRoot>
  <div className="grid gap-4 p-6 md:grid-cols-2">
    <section className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">Week 4 · Live</p>
      <MatchupSummary leagueId="1180245387261214720" matchup={matchup} />
    </section>
    <section className="flex items-center gap-2 rounded-xl border bg-card p-4">
      <PositionBadge position="WR" label="WR3" />
      <span className="font-mono tabular-nums text-positive">+318</span>
    </section>
  </div>
</DsRoot>
```
