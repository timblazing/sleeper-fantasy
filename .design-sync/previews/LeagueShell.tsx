import { LeagueShell, PageContainer, PageHeader } from "sleeper-fantasy-dashboard";
import { LEAGUE_CHROME, REDRAFT_CHROME } from "./_fixtures/a-chrome";

const Tile = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div className="rounded-xl border bg-card p-4">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
  </div>
);

const Dashboard = () => (
  <PageContainer className="flex flex-col gap-6">
    <PageHeader title="Dashboard" description="This week at a glance — your matchup and what needs attention." />
    <div className="grid grid-cols-2 gap-4">
      <Tile label="Record" value="3–0" hint="1st of 12 · Fourth & Long" />
      <Tile label="Week 4" value="93.6 – 91.2" hint="58% to beat Turf Monsters" />
    </div>
  </PageContainer>
);

// The shell is sized to the viewport (min-h-svh / h-svh). The capture viewport is 700px tall but the
// cell sits under ~36px of card padding, so pin the shell to a 620px frame to keep the footer and
// account row in shot.
const H = 620;
const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="a-shell-frame" style={{ height: H, overflow: "hidden", transform: "translateZ(0)" }}>
    <style>{`.a-shell-frame [data-slot=sidebar-wrapper]{min-height:${H}px}.a-shell-frame [data-slot=sidebar-container]{height:${H}px}`}</style>
    {children}
  </div>
);

export const DynastyDashboard = () => <Frame><LeagueShell league={LEAGUE_CHROME}><Dashboard /></LeagueShell></Frame>;

export const CollapsedSidebar = () => <Frame><LeagueShell league={LEAGUE_CHROME} defaultOpen={false}><Dashboard /></LeagueShell></Frame>;

export const RedraftLeague = () => (
  <Frame><LeagueShell league={REDRAFT_CHROME}>
    <PageContainer className="flex flex-col gap-6">
      <PageHeader title="Injury Report" description="Every rostered player on the injury report, ranked by how much it hurts your lineup." />
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">14 players questionable or worse this week</div>
    </PageContainer>
  </LeagueShell></Frame>
);
