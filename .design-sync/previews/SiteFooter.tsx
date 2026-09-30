import { SiteFooter } from "sleeper-fantasy-dashboard";

export const Attribution = () => <SiteFooter />;

export const BelowPageContent = () => (
  <div className="flex flex-col" style={{ minHeight: 240 }}>
    <div className="p-6">
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">Injury Report · 14 players questionable or worse this week</div>
    </div>
    <SiteFooter />
  </div>
);
