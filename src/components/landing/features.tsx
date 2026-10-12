import type { ReactNode } from "react";

// Static visuals built from series tokens — illustrations of the tools, not screenshots.
function MatchupVisual() {
  return (
    <div className="space-y-3">
      {[{ a: "Gridiron Gang", s: "118.4", w: 62 }, { a: "Bye Week Heroes", s: "101.9", w: 38 }].map((row) => (
        <div className="flex items-center justify-between text-xs" key={row.a}>
          <span className="text-muted-foreground">{row.a}</span>
          <span className="font-medium tabular-nums">{row.s}</span>
        </div>
      ))}
      <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="bg-[var(--series-1)]" style={{ width: "62%" }} />
        <div className="ml-0.5 flex-1 bg-[var(--series-3)]" />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">62% win probability</p>
    </div>
  );
}

function PlayoffVisual() {
  return (
    <div className="space-y-2.5">
      {[94, 81, 58, 33, 12].map((pct, index) => (
        <div className="flex items-center gap-3 text-xs" key={pct}>
          <span className="w-3 text-muted-foreground tabular-nums">{index + 1}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-[var(--series-2)]" style={{ width: `${pct}%`, opacity: index < 3 ? 1 : 0.45 }} />
          </div>
          <span className="w-8 text-right tabular-nums">{pct}%</span>
        </div>
      ))}
    </div>
  );
}

function TradeVisual() {
  const sides = [
    { label: "You send", rows: [62, 38], color: "var(--series-1)" },
    { label: "You get", rows: [71, 24], color: "var(--series-4)" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {sides.map((side) => (
        <div className="space-y-1.5" key={side.label}>
          <p className="text-xs text-muted-foreground">{side.label}</p>
          {side.rows.map((value) => (
            <div className="flex h-7 items-center justify-between rounded-md border px-2 text-xs" key={value}>
              <span className="size-2 rounded-full" style={{ background: side.color }} />
              <span className="tabular-nums">{value}</span>
            </div>
          ))}
          <p className="pt-0.5 text-xs font-medium tabular-nums">{side.rows.reduce((a, b) => a + b, 0)}</p>
        </div>
      ))}
    </div>
  );
}

const FEATURES: { title: string; description: string; visual: ReactNode }[] = [
  { title: "Live matchups", description: "Scores, projections and win probability for every game in your league, updated as the games play.", visual: <MatchupVisual /> },
  { title: "Playoff race", description: "See who is in, who is out and what each remaining week is worth, from simulated odds.", visual: <PlayoffVisual /> },
  { title: "Trade calculator", description: "Price both sides of a deal on your league's own scoring and roster format.", visual: <TradeVisual /> },
];

export function Features() {
  return (
    <section className="scroll-mt-[60px] border-b" id="features">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
        {FEATURES.map((feature) => (
          <article className="flex flex-col gap-8 px-4 py-12 sm:px-6 md:py-16" key={feature.title}>
            <div aria-hidden="true" className="flex h-36 flex-col justify-center rounded-xl border bg-card p-4">{feature.visual}</div>
            <div>
              <h2 className="type-title">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
