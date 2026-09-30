import { DsRoot } from "sleeper-fantasy-dashboard";

const Swatch = ({ name, className }: { name: string; className: string }) => (
  <div className="flex flex-col gap-1.5">
    <div className={`h-10 rounded-md border ${className}`} />
    <span className="text-xs text-muted-foreground">{name}</span>
  </div>
);

export const DarkSurface = () => (
  <DsRoot className="p-6">
    <div className="max-w-md rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">Week 4 · Live</div>
      <div className="mt-1 text-lg font-semibold">Fourth & Long vs. Turf Monsters</div>
      <div className="mt-2 font-mono text-sm tabular-nums">93.6 – 91.2</div>
      <p className="mt-2 text-sm text-muted-foreground">DsRoot applies the app's dark theme, Geist and Geist Mono, and the tooltip context every page expects.</p>
    </div>
  </DsRoot>
);

export const ThemeTokens = () => (
  <DsRoot className="p-6">
    <div className="grid max-w-md grid-cols-4 gap-3">
      <Swatch name="background" className="bg-background" />
      <Swatch name="card" className="bg-card" />
      <Swatch name="muted" className="bg-muted" />
      <Swatch name="accent" className="bg-accent" />
      <Swatch name="primary" className="bg-primary" />
      <Swatch name="secondary" className="bg-secondary" />
      <Swatch name="destructive" className="bg-destructive" />
      <Swatch name="sidebar" className="bg-sidebar" />
    </div>
  </DsRoot>
);
