import { PageContainer, PageHeader } from "sleeper-fantasy-dashboard";

const Tile = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div className="rounded-xl border bg-card p-4">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
  </div>
);

export const PageSurface = () => (
  <PageContainer className="flex flex-col gap-6">
    <PageHeader title="Dashboard" description="This week at a glance — your matchup and what needs attention." />
    <div className="grid grid-cols-3 gap-4">
      <Tile label="Record" value="3–0" hint="1st of 12 · Fourth & Long" />
      <Tile label="Points for" value="412.6" hint="+14.4 vs. 2nd place" />
      <Tile label="Week 4 projection" value="118.6" hint="58% to beat Turf Monsters" />
    </div>
  </PageContainer>
);

export const DefaultPadding = () => (
  <PageContainer>
    <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
      Page content sits inside the shared max width with 16 / 24 / 32px padding at mobile, tablet, and desktop.
    </div>
  </PageContainer>
);
