import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CloudOff, Hourglass, TriangleAlert } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { PlayerBoardContext } from "@/components/player-board-context";
import { getDashboardPulse } from "@/lib/dashboard-pulse";
import { PageHeader } from "@/components/page-header";
import { RankingsToolbar } from "@/components/rankings-toolbar";
import { RankingsTable } from "@/components/rankings-table";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getLeagueChrome } from "@/lib/league-chrome";
import { getRankingsView } from "@/lib/rankings-data";
import { parseRankingsQuery, type RankingsSearchParams } from "@/lib/rankings-query";
import type { RaError } from "@/lib/roster-audit";
import { basisMeta } from "@/lib/value-basis";

export const metadata: Metadata = { title: "Players" };

// PLAN.md line 47: each failure kind gets its own explanation, and line 46 forbids
// auto-retrying a rate limit — the reader retries by reloading.
const ERROR_STATES: Record<RaError["kind"], { title: string; description: string }> = {
  "rate-limited": { title: "Players are rate limited", description: "RosterAudit is throttling requests right now. Wait a minute and reload — this page will not retry on its own." },
  "upstream-unavailable": { title: "RosterAudit is unavailable", description: "The player value service did not respond. Values will return once it is reachable again." },
  "invalid-response": { title: "Unexpected player data", description: "RosterAudit returned a response this app could not read, so no values are shown rather than wrong ones." },
  "missing-key": { title: "RosterAudit key required", description: "This deployment has no RosterAudit API key configured." },
  "rejected-key": { title: "RosterAudit key rejected", description: "The configured RosterAudit API key was refused." },
  "unsynced-league": { title: "League not synced", description: "Sync this league at https://rosteraudit.com/league/ to unlock its player values." },
  "no-history": { title: "No history available", description: "RosterAudit has no historical data for this league yet." },
};

export default async function PlayersPage({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<RankingsSearchParams> }) {
  const [{ leagueId }, rawQuery] = await Promise.all([params, searchParams]);
  const query = parseRankingsQuery(rawQuery);
  // The injury report is its own page now; keep old shared links working.
  if (rawQuery.view === "injuries") {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(rawQuery)) {
      if (key !== "view") for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
    }
    redirect(`/${leagueId}/injuries${params.size ? `?${params}` : ""}`);
  }
  // getLeagueChrome is the cheap read the layout already performs; it supplies the value basis
  // without the full dashboard fetch a LeagueShell-owning page would need.
  const [league, result, pulse] = await Promise.all([getLeagueChrome(leagueId), getRankingsView(leagueId, query), getDashboardPulse(leagueId).catch(() => null)]);

  // Dynasty leagues get the dynasty market board; every other format gets the same page priced
  // in projected points per game. Neither ever sees the other's numbers.
  const meta = basisMeta(league.basis);

  // The sidebar and chrome come from src/app/[leagueId]/layout.tsx, so this page renders
  // only its own content inside the standard container.
  return (
    <PageContainer className="flex flex-col gap-5">
      <PageHeader description={meta.blurb} title="Players" />
      {result.ok ? (
        <>
          <RankingsToolbar positions={result.view.positions} basis={result.view.basis} leagueId={leagueId} query={query} />
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="min-w-0"><RankingsTable query={query} view={result.view} /></div>
            <PlayerBoardContext view={result.view} pulse={pulse} username={query.username} />
          </div>
        </>
      ) : (
        <Card><CardContent><Empty className="min-h-72 border"><EmptyHeader><EmptyMedia variant="icon">{result.error.kind === "rate-limited" ? <Hourglass /> : result.error.kind === "invalid-response" ? <TriangleAlert /> : <CloudOff />}</EmptyMedia><EmptyTitle>{ERROR_STATES[result.error.kind].title}</EmptyTitle><EmptyDescription>{ERROR_STATES[result.error.kind].description}</EmptyDescription></EmptyHeader></Empty></CardContent></Card>
      )}
    </PageContainer>
  );
}
