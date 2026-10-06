# blasingame.dev — Style Reference
> a monochrome workshop: near-black canvas, hairline rules, tight geometric type

**Theme:** light and dark, following the system preference. There is no manual toggle.

blasingame.dev is the personal reference for the design system behind my projects. Surfaces step up from a near-black canvas, structure comes from 1px hairlines instead of shadows, and color appears only when it carries meaning. Display type is large, medium weight and tightly tracked; everything supporting is muted. Pages are stacks of full-bleed sections separated by edge-to-edge rules, with content held to a 1240px column.

## Tokens — Colors

Source of truth: `src/styles/system-tokens.css`. Use semantic Tailwind classes (`bg-card`, `text-muted-foreground`, `border-border`). Keep literal colors out of markup; the one exception is a brand color that identifies something, like a team.

| Name | Dark | Light | Token | Role |
|------|------|-------|-------|------|
| Canvas | `#0a0a0a` | `#ffffff` | `--background` | The page itself |
| Foreground | `#fafafa` | `#0a0a0a` | `--foreground` | Content and headings |
| Surface | `#171717` | `#ffffff` | `--card` | Cards and raised content |
| Primary | `#e5e5e5` | `#171717` | `--primary` | Primary actions |
| Subtle | `#262626` | `#f5f5f5` | `--muted` | Tab tracks, secondary fills, grouping |
| Accent | `#262626` | `#f5f5f5` | `--accent` | Hover and selected fills |
| Border | `rgb(255 255 255 / 10%)` | `#e5e5e5` | `--border` | Hairlines and structure |
| Border strong | `rgb(255 255 255 / 18%)` | `#d4d4d4` | `--border-strong` | Emphasis rules |
| Input | `rgb(255 255 255 / 15%)` | `#e5e5e5` | `--input` | Input borders and selected tab fill |
| Secondary text | `#a1a1a1` | `#737373` | `--muted-foreground` | Supporting information |
| Success | `#4ade80` | `#16a34a` | `--success` | Complete, connected, in sync |
| Warning | `#fbbf24` | `#d97706` | `--warning` | Attention needed |
| Error | `#f87171` | `#dc2626` | `--destructive` | Something to resolve |
| Information | `#60a5fa` | `#2563eb` | `--info` | Helpful context |

The palette follows shadcn/ui's neutral theme: the dark canvas is `#0a0a0a`, and surfaces step up to `#171717` (cards) and `#262626` (muted, accent, secondary). Dark borders and inputs are white at low alpha so they stay visible on every surface.

## Tokens — Typography

### DM Sans — Display only · `--font-display`
- **Weight:** 500. Page titles and the home hero.

### SF Pro — all other interface text · `--font-sans`
- **Weights:** 400, 500, 600 (headings are 500; 600 only for the wordmark)
- **Role:** heading, lead, title, body, and caption. Headings lean in with tight negative tracking; supporting text is muted at 14–16px.
- **Stack:** `"SF Pro Text", "SF Pro", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`. Apple devices get SF Pro; others fall back to the system UI font.

### Menlo — code, tokens, measurements · `--font-mono`
- Use tabular numbers for data.

| Role | Size | Weight | Line height | Tracking | Use |
|------|------|--------|-------------|----------|-----|
| Display | 48–72px | 500 | 1.0 | −0.05em | One per page. The main statement |
| Heading | 36px (30 on phones) | 500 | 1.1 | −0.04em | Section titles |
| Lead | 26px (20 on phones) | 500 | 1.25 | −0.025em | Opening statement of a section |
| Title | 20px | 500 | — | −0.015em | Cards, dialogs, list items |
| Body | 16px (14px in panels) | 400 | 1.625 | — | Descriptions, muted |
| Caption | 12px | 400 | — | — | Fine print, metadata |

## Tokens — Spacing & Shape

**Base unit:** 4px · scale 4, 8, 12, 16, 24, 32, 48, 64, 96

- 8–12px inside a control, 16–32px inside a panel, 96px between sections (72px on phones).
- Container: 1288px max, 24px gutters (16px on phones), so content is 1240px.
- Header: 60px. Footer: 20px vertical padding.

| Name | Radius | Token | Use |
|------|--------|-------|-----|
| Control | 8px | `rounded-lg` | Buttons, nav links, tabs, inputs, small surfaces |
| Panel | 12px | `rounded-xl` | Cards, dialogs, grouped content |
| Feature | 16px | `rounded-2xl` | Showcase surfaces and demos |
| Pill | 999px | `rounded-full` | Hero and call-to-action buttons, badges, avatars, switches, status dots. Not nav links, tabs, or buttons inside panels |

As in shadcn/ui, 8px is the default and a pill is the exception. Elevation comes from the surface and a border, not shadows.

## Tokens — Motion

150ms hover and focus color, 200ms icon turns and small state changes, 250ms disclosure height and opacity. Nothing moves on its own. Honor `prefers-reduced-motion`.

## Layout & Patterns

Components live in `src/components/design-system/`; styles in `src/styles/design-system.css`.

- **Header:** sticky, 60px. Wordmark (`blasingame.dev`) only, no logo, on the left; on the right the page links (Foundations, Components, Blocks), a vertical separator, and the GitHub icon. Below 640px, a "Menu" button (hamburger + label) replaces the wordmark and links and opens a left `Sheet` with the wordmark, large 24px links (Home, Foundations, Components, Blocks), and GitHub at the bottom; the GitHub icon stays on the right of the bar. The bottom rule and frosted background (`background/80` + blur) appear only once the page scrolls; at the top there is no border.
- **Page header** (`<PageHeader>`): display title and 18px muted description over a masked dot field. One per page.
- **Section** (`<Section>`): heading in a 0.7fr column, content in 1.3fr (`stacked` for wide content). Each section is separated from the next by a full-width 1px rule that runs edge to edge.
- **Lead** (`<Lead strong="…">`): one strong sentence in foreground, the rest muted, then 14px body text.
- **Actions:** `.ds-button` (primary call to action, 40px tall, pill, optional `<kbd>`) and `.ds-button.is-ghost`. Inline links use `<TextLink>`: underline in the strong border color, arrow nudges up-right on hover.
- **Tabs:** the `Tabs` component (8px track on `--muted`). Never hand-roll tab buttons On phones, when the tabs won't fit, swap them for a `Select` with the same options.
- **Disclosure:** native `<details className="ds-disclosure">` with a plus that turns 45° when open.
- **Footer:** compact, 20px vertical padding under an edge-to-edge top rule; the `blasingame.dev` wordmark left, GitHub and page links right.

## Do's and Don'ts

### Do
- Use semantic tokens so both themes work.
- Separate sections with one full-width hairline and generous space.
- Reserve color for meaning: success, warning, error, information.
- Use pills for hero and call-to-action buttons, badges, avatars, and switches; 8px for nav links, tabs, and controls inside panels.
- Keep display type at weight 500 with tight tracking.

### Don't
- Don't use shadows for elevation or add gradients (the masked dot field is the one decoration).
- Don't put a logo next to the wordmark in the header.
- Don't draw a header border at the top of the page.
- Don't hand-roll tabs, buttons, or toggles that exist in `src/components/ui/`.
- Don't use literal hex colors in markup.

## Components

shadcn/ui and Base UI are the core. Add shadcn/ui components in their Base UI variant (`https://ui.shadcn.com/r/styles/base-nova/<name>.json`) before reaching for anything else.

- [shadcn/ui](https://ui.shadcn.com): primary source for core UI components. By shadcn and Vercel.
- [Base UI](https://base-ui.com): the unstyled, accessible primitives under the components. By MUI and the Base UI team.
- [coss ui](https://coss.com/ui): additional Base UI primitives. By coss.com.
- [blocks.so](https://blocks.so): composed React, Tailwind, and shadcn/ui interfaces. By Ephraim Duncan.
- [mapcn](https://www.mapcn.dev): React map components using MapLibre and Tailwind. Source by AnmolSaini16 and contributors.

`src/components/ui/` contains local primitives. Inspect their actual APIs before using them; Base UI and Radix conventions differ.

## Pages

- `/`: landing page: header, a hero that fills the viewport, and footer.
- `/foundations`: color, type, spacing, shape, motion, patterns, and the downloadable design files.
- `/components`: library references and attribution.
- `/blocks`: generic composed layouts with preview, viewport sizes, and source. First block: Landing Page.
- `/fillrate`, `/sportscal`, `/sleeper-fantasy-dashboard`: per-project design galleries. Source lives in `src/components/projects/`.

## Files

Published at `/design/`: `DESIGN.md`, `theme.css` (Tailwind v4 `@theme`), `variables.css` (CSS variables), `tokens.json` (design tokens). Edit `docs/design/` and `src/styles/system-tokens.css`; `bun run reference:sync` regenerates the public copies.
