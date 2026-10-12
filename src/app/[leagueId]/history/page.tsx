import type { Metadata } from "next";
import { HistoryIcon } from "lucide-react";
import { HistoryChampions } from "@/components/history-champions";
import { HistoryLeaderboard } from "@/components/history-leaderboard";
import { HistoryRecords } from "@/components/history-records";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { SeasonTimelineCard } from "@/components/season-timeline";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getLeagueHistory } from "@/lib/league-history";
import { getSeasonTimeline } from "@/lib/team-insights";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<{ username?: string | string[] }> }) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const username = typeof query.username === "string" ? query.username : undefined;
  const [history, timeline] = await Promise.all([getLeagueHistory(leagueId).catch(() => null), getSeasonTimeline(leagueId).catch(() => null)]);
  const hasHistory = Boolean(history?.managers.some((row) => row.games > 0));

  return (
    <PageContainer className="flex flex-col gap-5">
      <PageHeader title="History" description={history?.singleSeason || !hasHistory ? "Titles, all-time standings, and records across the seasons this league has played." : `Titles, all-time standings, and records across ${history?.seasons.length} seasons.`} />
      {history && hasHistory ? (
        <>
          <HistoryChampions leagueId={leagueId} managers={history.managers} seasons={history.seasons} username={username} />
          <HistoryLeaderboard leagueId={leagueId} rows={history.managers} username={username} />
          <HistoryRecords leagueId={leagueId} managers={history.managers} records={history.records} username={username} />
        </>
      ) : (
        <Card>
          <CardContent>
            <Empty className="min-h-64 border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><HistoryIcon /></EmptyMedia>
                <EmptyTitle>No past seasons yet</EmptyTitle>
                <EmptyDescription>Champions, all-time standings, and records appear once Sleeper returns scored games from earlier seasons.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
      {timeline ? <SeasonTimelineCard timeline={timeline} /> : null}
    </PageContainer>
  );
}
