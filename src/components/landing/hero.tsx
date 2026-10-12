import { ConnectForm } from "@/components/landing/connect-form";

// The dot field is the one allowed decoration: a quiet grid that fades out from the headline.
const DOT_FIELD = {
  backgroundImage: "radial-gradient(color-mix(in oklch, var(--muted-foreground) 55%, transparent) 1px, transparent 1.5px)",
  backgroundSize: "22px 22px",
  maskImage: "radial-gradient(ellipse 70% 65% at 50% 45%, black 20%, transparent 75%)",
  WebkitMaskImage: "radial-gradient(ellipse 70% 65% at 50% 45%, black 20%, transparent 75%)",
} as const;

export function Hero({ week, preselectLeagueId, demoHref }: { week: number | null; preselectLeagueId?: string; demoHref?: string }) {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-60px)] items-center justify-center overflow-hidden border-b">
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={DOT_FIELD} />
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 text-center sm:px-6">
        {week ? (
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
            Live for Week {week}
          </p>
        ) : null}
        <h1 className="type-display mx-auto max-w-3xl text-balance">Your league, scouted.</h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          Matchup forecasts, playoff odds, trade values and draft grades for any Sleeper league. No sign-in — just your username.
        </p>
        <div className="mt-10">
          <ConnectForm demoHref={demoHref} preselectLeagueId={preselectLeagueId} />
        </div>
      </div>
    </section>
  );
}
