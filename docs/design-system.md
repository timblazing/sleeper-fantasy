# Design system migration

Reference: https://components.blasingame.dev/foundations (reviewed 2026-10-06).

## First pass

`src/app/globals.css` owns the shared neutral light/dark palette and semantic
success, warning, error, and information colors. The application still defaults
to dark. Existing positive/negative tokens alias success/destructive. Position
chips and manager series retain categorical colors; team colors identify teams.
Single-series charts use a neutral ramp.

Interface type uses SF Pro through the platform system stack, with system-ui on
platforms where SF Pro is unavailable. DM Sans is loaded through next/font for
display text; Menlo has a native monospace fallback. Data remains tabular.

The 4px spacing unit, 8px controls, 12px panels, 16px feature surfaces, and pill
CTAs follow the reference. Shared page headings use 30px on phones and 36px on
desktop, medium weight and tight tracking. Panel text remains compact at 14px.
Cards use neutral borders, with stronger borders for accent cards instead of
teal gradients and glows. Elevation comes from surfaces and borders, not shadows.
Tabs use a sliding indicator. Hover colors use 150ms and tab/dialog state changes
use 200ms. Reduced motion disables animated transitions throughout the app.

## Next passes

- Audit route-specific typography, hardcoded status colors, gradients, and
  monospace labels. Use monospace for code and measurements; use tabular-nums
  for ordinary data without requiring a monospace font.
- Apply the reference page patterns where appropriate: 1288px page width,
  24px gutters (16px on phones), 60px sticky chrome, and compact ruled footers.
  Keep dense fantasy tables usable; 96px section spacing and 48–72px display
  titles belong to editorial pages, not every dashboard panel.
- Consolidate route-specific disclosures into native details/summary with a
  turning plus and 250ms height/opacity transitions where supported.
- Review each route at desktop and phone widths before declaring the full
  project migrated. This first pass establishes the foundations and shared
  primitives, not a complete route-by-route conversion.
