import Link from "next/link";
import { ArrowUpRight, SparklesIcon } from "lucide-react";
import { DashboardWaivers } from "@/components/dashboard-waivers";
import { DashboardScoring } from "@/components/dashboard-scoring";
import { DashboardPriorities, DashboardRoster } from "@/components/dashboard-opportunities";
import { RecentActivityCard } from "@/components/recent-activity-card";
import type { DashboardPulse } from "@/lib/dashboard-pulse";
import { MatchupLineup } from "@/components/matchup-lineup";
import { MatchupSummary } from "@/components/matchup-summary";
import { PanelHeader } from "@/components/panel-header";
import { PlayoffRace } from "@/components/playoff-race";
import { HistoryLeaderboard } from "@/components/history-leaderboard";
import type { PlayoffPicture, RemainingGame } from "@/lib/playoff-odds";
import { TeamLink } from "@/components/team-link";
import type { LeagueHistory } from "@/lib/league-history";
import { PageHeader } from "@/components/page-header";
import { SummaryMetrics } from "@/components/summary-metrics";
import { PageContainer } from "@/components/page-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { OverviewData } from "@/lib/team-insights";
import type { MatchupDetail } from "@/lib/types";
import { withUsername } from "@/lib/utils";

function CurrentMatchup({ data, schedule = [] }: { data: OverviewData; schedule?: RemainingGame[] }) {
  const { matchup } = data;
  const upcoming = schedule.filter(game => game.week > data.state.matchupWeek).slice(0, 3);

  return (
    <Card accent className="h-full">
      <PanelHeader title={data.team && matchup && (matchup.home.team.rosterId === data.team.rosterId || matchup.away.team.rosterId === data.team.rosterId) ? "Your matchup" : "This week"} description={`Week ${data.state.matchupWeek}${data.state.regularSeason ? "" : " · preseason preview"}`} actions={<Badge variant="secondary">{data.league.superflex ? "Superflex" : "1QB"}</Badge>} />
      <CardContent className="flex flex-col gap-3">
        {matchup ? (
          <>
            <div className="rounded-lg bg-background/40 p-2.5 sm:p-3"><MatchupSummary featured leagueId={data.league.id} matchup={matchup} username={data.username} /></div>
            <LineupPreview leagueId={data.league.id} matchup={matchup} username={data.username} />
            {upcoming.length ? <section className="mt-1 border-t pt-4">
              <h3 className="mb-3 text-sm font-medium">Up next</h3>
              <div className="grid gap-3 sm:grid-cols-3">{upcoming.map(game => <div key={game.week} className="min-w-0 rounded-lg border bg-background/40 p-3">
                <div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>Week {game.week}</span><span className="tabular-nums">{game.winProbability.toFixed(0)}% win est.</span></div>
                <TeamLink className="mt-2 block truncate text-sm font-medium" leagueId={data.league.id} rosterId={game.opponentRosterId} username={data.username}>{game.opponent}</TeamLink>
              </div>)}</div>
            </section> : null}
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

export function Overview({ data, picture, history, pulse }: { data: OverviewData; picture?: PlayoffPicture; history?: LeagueHistory | null; pulse?: DashboardPulse | null }) {
  const playoff = picture?.rows.find(row => row.rosterId === data.team?.rosterId);
  const games = data.team ? data.team.wins + data.team.losses + data.team.ties : 0;
  const metrics = data.team ? [
    { label: "Season record", value: `${data.team.wins}–${data.team.losses}${data.team.ties ? `–${data.team.ties}` : ""}`, detail: data.team.name },
    { label: "Points per game", value: games ? (data.team.pointsFor / games).toFixed(1) : "—", detail: games ? `#${data.team.powerRank} of ${data.league.teams} in scoring` : "Waiting for kickoff" },
    { label: "Playoff odds", value: playoff ? `${playoff.playoffOdds.toFixed(1)}%` : "—", detail: playoff ? `${playoff.projectedWins.toFixed(1)} projected wins` : "Simulation unavailable" },
    { label: data.league.isDynasty ? "Dynasty value rank" : "Roster strength", value: data.valuesReady ? `#${data.team.valueRank}` : "—", detail: data.valuesReady ? `of ${data.league.teams} · ${data.league.isDynasty ? "market value" : "projected PPG+"}` : "Player values unavailable" },
  ] : [];
  return (
    <PageContainer className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader description={`${data.league.name} · ${data.league.season}`} title="Dashboard" />
        <div className="flex flex-wrap items-center gap-2 pb-1"><Link className={buttonVariants({ size: "sm", variant: "outline" })} href={withUsername(`/${data.league.id}/matchups/${data.state.matchupWeek}`, data.username)}>All matchups</Link><Badge variant="secondary">Week {data.state.matchupWeek}</Badge><Badge variant={data.phase.tone === "positive" ? "success" : "secondary"}>{data.phase.label}</Badge></div>
      </div>
      {!data.team ? <ConnectPrompt leagueId={data.league.id} /> : null}
      {metrics.length ? <SummaryMetrics items={metrics} /> : null}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0"><CurrentMatchup data={data} schedule={picture?.remainingSchedule} /></div>
        <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-1">
          <DashboardScoring weeks={pulse?.scoring ?? []} rosterId={data.team?.rosterId} unavailable={pulse == null || !pulse.scoringReady} />
          <DashboardWaivers pulse={pulse} leagueId={data.league.id} username={data.username} />
        </div>
        <div className="min-w-0">{picture ? <PlayoffRace leagueId={data.league.id} picture={picture} username={data.username} /> : null}</div>
        <div className="min-w-0"><DashboardPriorities data={data} /></div>
        <div className="min-w-0"><DashboardRoster data={data} /></div>
        <div className="min-w-0"><RecentActivityCard activity={data.activity.slice(0, 4)} leagueId={data.league.id} username={data.username} /></div>
      </div>
      <div className="flex items-center justify-between pt-2"><h2 className="text-lg font-semibold">League history</h2><Link className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" href={withUsername(`/${data.league.id}/scouting-report`, data.username)}>Scout managers<ArrowUpRight className="size-3.5" /></Link></div>
      {history === undefined ? null : history?.managers.some((row) => row.games > 0) ? (
        <HistoryLeaderboard leagueId={data.league.id} rows={history.managers} seasonCount={history.seasons.length} username={data.username} />
      ) : (
        <Card><PanelHeader title="All-time standings" /><CardContent><p className="text-sm text-muted-foreground">Past-season standings will appear once Sleeper returns scored league history.</p></CardContent></Card>
      )}
    </PageContainer>
  );
}
