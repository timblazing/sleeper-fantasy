import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { RecommendedActionsCard } from "@/components/insights";
import { MatchupLineup } from "@/components/matchup-lineup";
import { MatchupSummary } from "@/components/matchup-summary";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { avatarUrl, initials } from "@/lib/display";
import type { OverviewData, Tone } from "@/lib/team-insights";
import { cn } from "@/lib/utils";
import type { MatchupDetail } from "@/lib/types";

/**
 * Tone is the only thing on this screen allowed to color a number, and it maps to the
 * semantic result tokens rather than a per-component hex.
 */
const TONE_TEXT: Record<Tone, string> = {
  positive: "text-positive",
  warning: "text-warning",
  critical: "text-negative",
  neutral: "text-foreground",
};

/**
 * The dashboard hero. The champion banners on the League page set the visual language, and the
 * `accent` Card carries it; the identity anchors the left so the four numbers read as one strip
 * on the right rather than four stretched columns with dead air between them.
 */
function LeagueStatus({ data }: { data: OverviewData }) {
  const { team } = data;
  if (!team) return null;

  return (
    <Card accent>
      <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex min-w-0 items-center gap-3.5">
          <Avatar className="size-12 shrink-0 after:hidden">
            {team.avatar ? <AvatarImage alt="" src={avatarUrl(team.avatar)} /> : null}
            <AvatarFallback className="text-sm font-semibold">{initials(team.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-lg font-semibold leading-tight tracking-tight">{team.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">@{team.manager}</p>
          </div>
        </div>

        {/* Each metric is its own chip: the tint carries the grouping, so no rules are needed. */}
        <dl className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto">
          {data.metrics.map((metric) => (
            <div className="flex flex-col gap-1 rounded-lg bg-background/40 px-3 py-2.5 lg:min-w-[7.5rem]" key={metric.id}>
              <dt className="truncate font-mono text-[0.625rem] uppercase tracking-wider text-primary/70">{metric.label}</dt>
              <dd className={cn("font-mono text-xl font-semibold leading-none tabular-nums", TONE_TEXT[metric.tone])}>{metric.value}</dd>
              {metric.detail ? <dd className="truncate font-mono text-[0.625rem] text-muted-foreground">{metric.detail}</dd> : null}
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function CurrentMatchup({ data }: { data: OverviewData }) {
  const { matchup } = data;

  return (
    <Card accent>
      <CardHeader>
        <CardTitle>{data.team && matchup && (matchup.home.team.rosterId === data.team.rosterId || matchup.away.team.rosterId === data.team.rosterId) ? "Your matchup" : "This week"}</CardTitle>
        <CardDescription>Week {data.state.matchupWeek}{data.state.regularSeason ? "" : " · preseason preview"}</CardDescription>
      </CardHeader>
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
            <EmptyDescription>Roster grades, lineup warnings, and recommended moves are built around your team. Add <code className="font-mono">?username=</code> to the URL, or pick your league from the home page.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/?league=${leagueId}`}>Connect account</Link>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}

export function Overview({ data }: { data: OverviewData }) {
  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader description="This week at a glance — your matchup and what needs attention." title="Dashboard" />

      {data.team ? <LeagueStatus data={data} /> : <ConnectPrompt leagueId={data.league.id} />}

      <CurrentMatchup data={data} />

      <RecommendedActionsCard data={data} />
    </PageContainer>
  );
}
