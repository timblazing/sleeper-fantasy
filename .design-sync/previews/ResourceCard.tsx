import { ResourceCard } from "sleeper-fantasy-dashboard";
import type { ResourceCardItem } from "@/components/resource-card";
import { Stage } from "./_fixtures/stage";

// Entries as they appear in the app's resources directory (src/lib/resources/data.ts).
const ROSTER_AUDIT: ResourceCardItem = {
  name: "RosterAudit", url: "https://rosteraudit.com", status: ["integrated", "free"],
  note: "The trade values behind this dashboard. Trade calculator, rankings, league hub, and a free public API, with native TE-premium support matching this league's scoring.",
};
const FANTASY_CALC: ResourceCardItem = { name: "FantasyCalc", url: "https://fantasycalc.com/trade-calculator", status: ["free"], note: "Secondary value source, used here to cross-reference close trades." };
const KTC: ResourceCardItem = { name: "KeepTradeCut", url: "https://keeptradecut.com/trade-calculator", status: ["scrape_required"], note: "Community-sourced values, de-facto standard. Has TE-premium variants (tep/tepp/teppp). Could be added later as a v3 secondary source." };
const FANTASY_POINTS: ResourceCardItem = { name: "Fantasy Points", url: "https://www.fantasypoints.com/", status: ["free_tier", "paid"], note: "Expected fantasy points, route share, target share, air yards, targets per route run." };
const FP_TRADE_VALUE: ResourceCardItem = { name: "FantasyPros (dynasty trade value, March 2025)", url: "https://www.fantasypros.com/2025/03/fantasy-football-rankings-dynasty-trade-value-chart-march-2025-update/", status: ["free", "outdated"], note: "Dated March 2025. Look for a current FantasyPros article instead." };
const DRAFT_SHARKS: ResourceCardItem = { name: "Draftsharks (dynasty PPR)", url: "https://www.draftsharks.com/trade-value-chart/dynasty/ppr", status: ["paid"] };
const NFLVERSE: ResourceCardItem = { name: "nflverse / nflreadr", url: "https://nflreadr.nflverse.com/" };

const Grid = ({ children }: { children: React.ReactNode }) => (
  <Stage><ul style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, maxWidth: 620 }}>{children}</ul></Stage>
);
const One = ({ children }: { children: React.ReactNode }) => <Stage><ul style={{ maxWidth: 340 }}>{children}</ul></Stage>;

export const Featured = () => <One><ResourceCard featured resource={ROSTER_AUDIT} /></One>;

export const Standard = () => <One><ResourceCard resource={FANTASY_CALC} /></One>;

export const StatusBadges = () => (
  <Grid>
    <ResourceCard resource={KTC} />
    <ResourceCard resource={FANTASY_POINTS} />
    <ResourceCard resource={FP_TRADE_VALUE} />
    <ResourceCard resource={DRAFT_SHARKS} />
  </Grid>
);

export const LinkOnly = () => <One><ResourceCard resource={NFLVERSE} /></One>;
