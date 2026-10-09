# Site UI audit

Reviewed 2026-10-09. The canonical theme and composition rules live in
[design-system.md](design-system.md).

## Accepted direction

Sleeper Fantasy is a league decision desk. The dashboard combines the immediate
matchup and lineup priorities with scoring form, waiver opportunities, playoff
position, roster strengths, transactions and league history. Tool pages lead
straight into their workspace: only the dashboard has the four-card summary row.
Players' Rankings/Injury Report tabs have an active underline without a full-width
divider beneath them.

Players pair the ranking board with unrostered weekly projections and dynasty
market context. Trade keeps two asset panels beside the comparison. Draft pairs
manager grades with position/round surplus. Resources support URL-backed search,
league formats and category navigation. Matchups use a two-column desktop board.
All use shared page gutters, neutral surfaces, semantic colors and control styles.
Loading, empty, error and not-found containers use the same page width.

Scouting uses wrapping avatar/name buttons above one shared manager report;
phones have a horizontal selector with a swipe hint. Search and position/activity
filters reduce the list. The selected report places a trade angle beside recorded
transaction activity and draft preferences, followed by evidence-backed insights.

Redraft scouting uses current projected scoring-room needs and complementary
player swaps. It excludes dynasty windows, future-pick suggestions and window
bonuses in the fit score. Dynasty keeps those long-term lenses. Pick accumulators
means net historical pick acquisitions, not verified current pick ownership.
Unavailable valuations hide position conclusions and trade-fit recommendations;
recorded behavior remains useful. Historical activity is labelled by scanned seasons.

## Browser coverage

Validation uses headless agent-browser at desktop 1440×900 and phone 393×852,
in both dark and light modes. Real connected leagues used: Slim Pickens Memorial
League (redraft) and Oiled Down (dynasty).

| Surface | Coverage |
| --- | --- |
| Dashboard | Desktop/phone, both themes; scoring and waivers; wider desktop composition |
| Players rankings and injuries | Desktop/phone, both themes; summary cards and tab divider removed; preserved URL filters |
| Trade | Desktop/phone, both themes; staged one player each side, calculated comparison, swap and clear |
| Scouting | Both league formats and both themes; desktop/phone; manager selection, search, scoring/dynasty vocabulary |
| Draft | Leaderboard, results, class trends and career in both themes/viewport sizes; individual manager dialog |
| Resources | Desktop/phone, both themes; search preserved username and format in URL |
| Matchups | Desktop/phone, both themes; starting-lineup dialog and dismissal |
| Player detail | Summary, Game log, Team and History; both themes/viewport sizes |
| Team detail | Overview and Roster; both themes/viewport sizes |
| NFL game details | Play-by-play, box score and team stats, both themes; phone bottom sheet |
| Component specimens | Desktop/phone and both themes; shared foundation appearance |
| Connect and unavailable routes | Shared controls and responsive empty/error surfaces |

Native scrollbar computation returned `none` for every overflowing element on the
main routes and detail sheets. No page-wide horizontal overflow appeared in the
32 main-route checks or the 24 player/team detail checks. Both detail sheets measured
480px on desktop and 393px on the phone. The focused game-log scroll container moved
40px on ArrowRight in each viewport/theme, confirming content remains reachable.

No NFL game was live during the audit. A browser-only network fixture changed the
scoreboard's live flags to expose the existing ticker; the game-detail request
used the real completed TB–DAL game. This did not change application data or code.
The network override was removed afterward.

The scouting axe audit initially found an unlabelled sidebar navigation landmark
and low-contrast need pills in light mode. Both were corrected; the final scouting
audits returned zero violations and zero incomplete checks in both themes.
Automated audits complement visual review and keyboard interactions.

Screenshots from this local review are in `/tmp/sleeper-unify/`; they are transient
validation artifacts, not application assets. `final-*` names identify the accepted
main-route and detail-sheet captures. The review included a second pass after
removing the unwanted summary cards and replacing the scouting sidebar.

## Required checks

- `npm run typecheck`
- `npm run lint`
- `npm test` (472 passing tests, including redraft scouting semantics and selector behavior)
- `npm run design:check` (pinned foundations remain verified)
- `npm run build`
- `git diff --check`

This is local implementation/validation. It does not imply publication or deployment.
