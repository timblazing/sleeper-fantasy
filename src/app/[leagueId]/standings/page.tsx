import type { Metadata } from "next";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { PlayoffBracketCard } from "@/components/playoff-bracket-card";
import { PlayoffRace } from "@/components/playoff-race";
import { StandingsTable } from "@/components/standings-table";
import { getLeagueValueContext } from "@/lib/league-values";
import { getPlayoffPicture } from "@/lib/playoff-odds";

export const metadata: Metadata = { title: "Standings" };

export default async function StandingsPage({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<{ username?: string | string[] }> }) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const username = typeof query.username === "string" ? query.username : undefined;
  const [context, picture] = await Promise.all([getLeagueValueContext(leagueId), getPlayoffPicture(leagueId, username).catch(() => null)]);
  const myRosterId = picture?.myRosterId ?? picture?.rows.find((row) => row.isUser)?.rosterId;
  const brackets = [picture?.winnersBracket, picture?.losersBracket].filter((bracket) => bracket?.rounds.length);

  return (
    <PageContainer className="flex flex-col gap-5">
      <PageHeader title="Standings" description={`${context.league.name} · ${context.league.season} season record, scoring, and the simulated road to the playoffs.`} />
      <StandingsTable leagueId={leagueId} myRosterId={myRosterId} odds={picture?.rows ?? []} playoffTeams={picture?.playoffTeams ?? Math.min(6, context.teams.length)} teams={context.teams} username={username} />
      {picture ? <PlayoffRace leagueId={leagueId} picture={picture} username={username} /> : null}
      {brackets.map((bracket) => bracket ? <PlayoffBracketCard bracket={bracket} key={bracket.kind} leagueId={leagueId} username={username} /> : null)}
    </PageContainer>
  );
}
