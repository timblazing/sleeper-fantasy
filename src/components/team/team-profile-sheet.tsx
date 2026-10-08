import { notFound } from "next/navigation";
import { TeamDetail } from "@/components/team/team-detail";
import { ResponsiveDetailSheet } from "@/components/responsive-detail-sheet";
import { getLeagueValueContext } from "@/lib/league-values";
import { withUsername } from "@/lib/utils";

export async function TeamProfileSheet({ leagueId, rosterId, username, intercepted = false }: { leagueId: string; rosterId: string; username?: string; intercepted?: boolean }) {
  if (!/^\d+$/.test(rosterId)) notFound();
  const id = Number(rosterId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const context = await getLeagueValueContext(leagueId);
  const team = context.teams.find(entry => entry.rosterId === id);
  if (!team) notFound();
  return (
    <ResponsiveDetailSheet title={team.name} intercepted={intercepted} fallbackHref={withUsername(`/${leagueId}/league`, username)}>
      <TeamDetail leagueId={leagueId} leagueName={context.league.name} season={context.league.season} team={team} teams={context.teams.length} username={username} valuesReady={context.valuesReady} />
    </ResponsiveDetailSheet>
  );
}
