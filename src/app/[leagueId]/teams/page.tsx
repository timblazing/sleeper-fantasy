import type { Metadata } from "next";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { TeamsGrid } from "@/components/teams-grid";
import { findTeamForUser, getLeagueValueContext } from "@/lib/league-values";
import { getNflLeaguesForUsername } from "@/lib/sleeper";

export const metadata: Metadata = { title: "Teams" };

export default async function TeamsPage({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<{ username?: string | string[] }> }) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const username = typeof query.username === "string" ? query.username : undefined;
  const [context, account] = await Promise.all([
    getLeagueValueContext(leagueId),
    username ? getNflLeaguesForUsername(username).catch(() => undefined) : undefined,
  ]);
  const mine = findTeamForUser(context, account?.userId);
  const teams = context.teams.toSorted((a, b) => a.valueRank - b.valueRank);

  return (
    <PageContainer className="flex flex-col gap-5">
      <PageHeader title="Teams" description={`All ${teams.length} teams in ${context.league.name}, ranked by ${context.basis === "dynasty" ? "dynasty roster value" : "projected roster strength"}. Open one to see its roster.`} />
      <TeamsGrid leagueId={leagueId} myRosterId={mine?.rosterId} teams={teams} username={username} valueLabel={context.basis === "dynasty" ? "Value rank" : "Strength"} valuesReady={context.valuesReady} />
    </PageContainer>
  );
}
