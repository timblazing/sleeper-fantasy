# 007 — Adopt the current blasingame.dev design system + light/dark toggle

Priority P1 · Effort M · Depends on — · Must land before 008–010.

## Why
`src/styles/reference/` pins an old copy of components.blasingame.dev. The site was rebuilt
(Fumadocs, shadcn base-nova) and `https://components.blasingame.dev/design/DESIGN.md` now
404s, so `npm run design:sync` is dead. The current system lives in
`~/DEV/github/active/components` (READ ONLY — never edit that repo). Its tokens differ:
OKLCH neutral palette, `.dark` class theming, multiplicative radius scale, SF Mono,
shadows only on floating layers (`shadow-md` popovers/menus, `shadow-lg` dialogs).

## Source of truth to copy from (read only)
- `~/DEV/github/active/components/src/app/global.css`: the `:root {}` (line ~90) and
  `.dark {}` (line ~155) blocks, and its `@theme inline` radius/font mappings.
- `~/DEV/github/active/components/content/docs/foundations/*.mdx`: colors, typography,
  radius, elevation, motion, spacing rules.

## Steps
1. **Tokens.** Replace `src/styles/system-tokens.css`'s import of `reference/variables.css`
   + `system-theme.css` with a local copy of the components repo's `:root` and `.dark`
   blocks (add a header comment: "Copied from timblazing/components src/app/global.css on
   <date>; that file is the source of truth"). Keep the app-only extras that exist today
   (`--success-foreground`, `--info-foreground`, `--destructive-text`,
   `--warning-foreground`, durations, `--spacing`, tracking) and give each a `.dark`
   override instead of the `@media (prefers-color-scheme: dark)` block.
2. **Delete the dead scraper:** `scripts/design-reference.mjs`, `src/styles/reference/`,
   `src/styles/system-theme.css`, and the `design:check` / `design:sync` npm scripts. Grep for
   any other reference (README, docs/, tests) and update it.
3. **Class-based dark mode.** In `src/app/globals.css` change the custom variant to
   `@custom-variant dark (&:is(.dark *));`. Convert every `@media (prefers-color-scheme: dark)`
   in `src/styles/*.css` (notably `fantasy-tokens.css`) to `.dark { … }`.
4. **Theme toggle.** Add `next-themes` (`attribute="class"`, `defaultTheme="system"`,
   `enableSystem`, `disableTransitionOnChange`). Put a `ThemeProvider` in
   `src/app/layout.tsx` (add `suppressHydrationWarning` to `<html>`). Build
   `src/components/theme-toggle.tsx`: a ghost icon `Button` (Sun/Moon/Monitor via a
   `DropdownMenu` with Light / Dark / System). Place it in the league header
   (`src/components/league-shell.tsx`, right side, before `ScorePlacementChrome` area) and
   expose it so plan 008's landing header can reuse it. Avoid hydration mismatch (render a
   placeholder icon until mounted).
5. **Theme mappings.** In `globals.css` `@theme inline`:
   - Radius: `--radius: 0.5rem`; sm `*0.6`, md `*0.8`, lg `1x`, xl `*1.4`, 2xl `*1.8`,
     3xl `*2.2`, 4xl `*2.6`.
   - `--font-mono: "SF Mono", Menlo, ui-monospace, SFMono-Regular, monospace`.
   - `--font-heading: var(--font-display)` to match the system.
   - Shadows: stop forcing every shadow to `none`; floating layers (popover, dropdown,
     tooltip, dialog, sheet) may use `shadow-md`/`shadow-lg`. In-flow cards stay shadowless.
     Remove the shadow-* token zeroing and any `--shadow-*` plumbing that only existed for it.
6. **Chart colors (user-approved).** Keep the colored `--series-1..8` palette and position
   colors as the project-owned data palette, defined for both `:root` and `.dark`. Set
   `--chart-1..5` to the first five series colors (not the grey ramp) so shadcn chart
   defaults are colored. Keep `src/lib/chart-style.ts` consistent; its tests must pass.
7. **Drift cleanup** in `src/components/**` and `src/app/**` (not `src/components/ui/`):
   - Literal hex colors (≈9) → semantic tokens or series/position tokens. Team brand colors
     that identify a team may stay.
   - `rounded-full` (≈27): keep only on avatars, badges, status dots, switches, pills for
     hero CTAs. Nav links, tabs, controls inside panels → `rounded-lg`.
   - Arbitrary `text-[Npx]` (≈14) → nearest Tailwind size or a `type-*` utility.
   - `src/styles/typography.css`: make `type-display`/`type-heading` use
     `var(--font-display)` per the system (display face only ≥30px; headings 500 weight).
8. **`/design-system` page** (`src/app/design-system/page.tsx` + `component-specimens.tsx`,
   `src/lib/design-specimens.ts`): update so it reflects the new tokens, shows both themes'
   swatches (or just renders under the active theme with the toggle present), and the
   series palette. Update `src/lib/showcase.test.ts`/specimen tests if they assert old values.

## Verify
`npm run typecheck && npm run lint && npm test` all pass. `npm run build` succeeds.
Start `npm run dev`, screenshot `/design-system` and a league dashboard in light and dark
(toggle works, persists across reload, no flash, no hydration warning in console).

## STOP if
The components repo's tokens are missing something the app needs that can't be expressed
as an app-owned extra — report instead of inventing a value.
