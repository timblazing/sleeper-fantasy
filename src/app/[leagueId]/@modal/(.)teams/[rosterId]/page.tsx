import { TeamProfileSheet } from "@/components/team/team-profile-sheet";

export default async function InterceptedTeamPage({ params, searchParams }: { params: Promise<{ leagueId: string; rosterId: string }>; searchParams: Promise<{ username?: string | string[] }> }) {
  const [{ leagueId, rosterId }, query] = await Promise.all([params, searchParams]);
  return <TeamProfileSheet intercepted leagueId={leagueId} rosterId={rosterId} username={typeof query.username === "string" ? query.username : undefined} />;
}
