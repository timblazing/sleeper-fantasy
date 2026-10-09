import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { RecommendedActionsCard } from "@/components/insights";
import { MatchupLineup } from "@/components/matchup-lineup";
import { MatchupSummary } from "@/components/matchup-summary";
import { PanelHeader } from "@/components/panel-header";
import { PlayoffRace } from "@/components/playoff-race";
import { HistoryLeaderboard } from "@/components/history-leaderboard";
import type { PlayoffPicture } from "@/lib/playoff-odds";
import type { LeagueHistory } from "@/lib/league-history";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { OverviewData } from "@/lib/team-insights";
import type { MatchupDetail } from "@/lib/types";

function CurrentMatchup({ data }: { data: OverviewData }) {
  const { matchup } = data;

  return (
    <Card accent>
      <PanelHeader title={data.team && matchup && (matchup.home.team.rosterId === data.team.rosterId || matchup.away.team.rosterId === data.team.rosterId) ? "Your matchup" : "This week"} description={`Week ${data.state.matchupWeek}${data.state.regularSeason ? "" : " · preseason preview"}`} />
      <CardContent className="flex flex-col gap-3">
        {matchup ? (
          <>
            <div className="rounded-lg bg-background/40 p-2.5 sm:p-3"><MatchupSummary leagueId={data.league.id} matchup={matchup} username={data.username} /></div>
            <LineupPreview leagueId={data.league.id} matchup={matchup} username={data.username} />
          </>
        ) : (
          <Empty className="border"><EmptyHeader><EmptyTitle>No matchup available</EmptyTitle><EmptyDescription>There is no matchup data for week {data.state.matchupWeek}.</EmptyDescription></EmptyHeader></Empty>
        )}
      </CardContent>
    </Card>
  );
}

function LineupPreview({ matchup, leagueId, username }: { matchup: MatchupDetail; leagueId: string; username?: string }) {
  if (!matchup.home.slots.length) return null;
  return <MatchupLineup leagueId={leagueId} matchup={matchup} username={username} />;
}

function ConnectPrompt({ leagueId }: { leagueId: string }) {
  return (
    <Card>
      <CardContent>
        <Empty className="min-h-56 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><SparklesIcon /></EmptyMedia>
            <EmptyTitle>Connect your Sleeper username</EmptyTitle>
            <EmptyDescription>Roster grades, lineup warnings, and recommended moves are built around your team. Connect your account to see recommendations for your roster.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/?league=${leagueId}`}>Connect account</Link>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}

export function Overview({ data, picture, history }: { data: OverviewData; picture?: PlayoffPicture; history?: LeagueHistory | null }) {
  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader description="This week at a glance — your matchup and what needs attention." title="Dashboard" />
      <CurrentMatchup data={data} />
      {!data.team ? <ConnectPrompt leagueId={data.league.id} /> : null}

      <RecommendedActionsCard data={data} />
      {picture ? <PlayoffRace leagueId={data.league.id} picture={picture} username={data.username} /> : null}
      {history === undefined ? null : history?.managers.some((row) => row.games > 0) ? (
        <HistoryLeaderboard leagueId={data.league.id} rows={history.managers} seasonCount={history.seasons.length} username={data.username} />
      ) : (
        <Card><PanelHeader title="All-time standings" /><CardContent><p className="text-sm text-muted-foreground">Past-season standings will appear once Sleeper returns scored league history.</p></CardContent></Card>
      )}
    </PageContainer>
  );
}
