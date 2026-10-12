import Link from "next/link";
import { CalendarCheck, Flame, Gem, SparklesIcon, Target } from "lucide-react";
import { DashboardWaivers } from "@/components/dashboard-waivers";
import { DashboardScoring } from "@/components/dashboard-scoring";
import { DashboardPriorities, DashboardRoster } from "@/components/dashboard-opportunities";
import { RecentActivityCard } from "@/components/recent-activity-card";
import type { DashboardPulse } from "@/lib/dashboard-pulse";
import { MatchupLineup } from "@/components/matchup-lineup";
import { MatchupSummary } from "@/components/matchup-summary";
import { PanelHeader, PanelLabel, PanelLink } from "@/components/panel-header";
import { PlayoffRace } from "@/components/playoff-race";
import { HistoryLeaderboard } from "@/components/history-leaderboard";
import type { PlayoffPicture, RemainingGame } from "@/lib/playoff-odds";
import { TeamLink } from "@/components/team-link";
import type { LeagueHistory } from "@/lib/league-history";
import { SummaryMetrics } from "@/components/summary-metrics";
import { PageContainer } from "@/components/page-container";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { OverviewData } from "@/lib/team-insights";
import type { MatchupDetail } from "@/lib/types";
import { cn, withUsername } from "@/lib/utils";

/** Inset surfaces inside a panel share one treatment. */
const TILE = "rounded-lg bg-background/50 ring-1 ring-border";

function CurrentMatchup({ data, schedule = [], className }: { data: OverviewData; schedule?: RemainingGame[]; className?: string }) {
  const { matchup } = data;
  const upcoming = schedule.filter(game => game.week > data.state.matchupWeek).slice(0, 3);

  return (
    <Card className={className}>
      <PanelHeader title={data.team && matchup && (matchup.home.team.rosterId === data.team.rosterId || matchup.away.team.rosterId === data.team.rosterId) ? "Your matchup" : "This week"} description={`Week ${data.state.matchupWeek}${data.state.regularSeason ? "" : " · preseason preview"}`} actions={<PanelLink href={withUsername(`/${data.league.id}/matchups/${data.state.matchupWeek}`, data.username)} label="All matchups this week" />} />
      <CardContent className="flex flex-1 flex-col gap-3">
        {matchup ? (
          <>
            <div className={cn(TILE, "p-2.5 sm:p-3")}><MatchupSummary featured leagueId={data.league.id} matchup={matchup} username={data.username} /></div>
            <LineupPreview leagueId={data.league.id} matchup={matchup} username={data.username} />
            {upcoming.length ? <section className="mt-auto border-t pt-4">
              <PanelLabel className="mb-3">Up next</PanelLabel>
              <div className="grid gap-3 sm:grid-cols-3">{upcoming.map(game => <div key={game.week} className={cn(TILE, "min-w-0 p-3")}>
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

const ROW = "grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] *:min-w-0";
const SIDE = "grid content-start gap-5 md:grid-cols-2 xl:flex xl:flex-col";

export function Overview({ data, picture, history, pulse }: { data: OverviewData; picture?: PlayoffPicture; history?: LeagueHistory | null; pulse?: DashboardPulse | null }) {
  const playoff = picture?.rows.find(row => row.rosterId === data.team?.rosterId);
  const games = data.team ? data.team.wins + data.team.losses + data.team.ties : 0;
  const metrics = data.team ? [
    { label: "Season record", icon: CalendarCheck, color: "var(--series-2)", value: `${data.team.wins}–${data.team.losses}${data.team.ties ? `–${data.team.ties}` : ""}`, detail: data.team.name },
    { label: "Points per game", icon: Flame, color: "var(--series-5)", value: games ? (data.team.pointsFor / games).toFixed(1) : "—", detail: games ? `#${data.team.powerRank} of ${data.league.teams} in scoring` : "Waiting for kickoff" },
    { label: "Playoff odds", icon: Target, color: "var(--series-1)", value: playoff ? `${playoff.playoffOdds.toFixed(1)}%` : "—", detail: playoff ? `${playoff.projectedWins.toFixed(1)} projected wins` : "Simulation unavailable" },
    { label: data.league.isDynasty ? "Dynasty value rank" : "Roster strength", icon: Gem, color: "var(--series-4)", value: data.valuesReady ? `#${data.team.valueRank}` : "—", detail: data.valuesReady ? `of ${data.league.teams} · ${data.league.isDynasty ? "market value" : "projected PPG+"}` : "Player values unavailable" },
  ] : [];
  return (
    <PageContainer className="flex flex-col gap-5">
      {!data.team ? <ConnectPrompt leagueId={data.league.id} /> : null}
      {metrics.length ? <SummaryMetrics items={metrics} /> : null}
      {/* Each row pairs a primary panel with a context column. Rows stretch, and the last panel in
          the context column grows, so both columns finish on the same line at xl. */}
      <div className={ROW}>
        <CurrentMatchup className="h-full" data={data} schedule={picture?.remainingSchedule} />
        <div className={SIDE}>
          <DashboardScoring className="xl:flex-1" weeks={pulse?.scoring ?? []} rosterId={data.team?.rosterId} unavailable={pulse == null || !pulse.scoringReady} />
          <DashboardWaivers pulse={pulse} leagueId={data.league.id} username={data.username} />
        </div>
      </div>
      <div className={ROW}>
        {picture ? <PlayoffRace className="h-full" leagueId={data.league.id} picture={picture} username={data.username} /> : null}
        <div className={cn(SIDE, !picture && "xl:col-span-2")}>
          <DashboardPriorities data={data} />
          <DashboardRoster className="xl:flex-1" data={data} />
        </div>
      </div>
      <div className={ROW}>
        {history === undefined ? null : history?.managers.some((row) => row.games > 0) ? (
          <HistoryLeaderboard className="h-full" leagueId={data.league.id} rows={history.managers} username={data.username} />
        ) : (
          <Card className="h-full"><PanelHeader title="All-time standings" /><CardContent><p className="text-sm text-muted-foreground">Past-season standings will appear once Sleeper returns scored league history.</p></CardContent></Card>
        )}
        <RecentActivityCard fill className={cn(history === undefined && "xl:col-span-2")} activity={data.activity.slice(0, 8)} leagueId={data.league.id} username={data.username} />
      </div>
    </PageContainer>
  );
}
