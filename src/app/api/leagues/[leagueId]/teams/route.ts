import { isLeagueId } from "@/lib/league-id";
import { getLeagueBase } from "@/lib/league-context";

/** The league's teams, for the command palette's lazy first-open load. */
export async function GET(_request: Request, context: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await context.params;
  if (!isLeagueId(leagueId)) return Response.json({ error: "Invalid league id." }, { status: 400 });

  try {
    const base = await getLeagueBase(leagueId);
    const teams = [...base.teamByRoster.values()].map(({ rosterId, name, manager }) => ({ rosterId, name, manager }));
    return Response.json({ teams });
  } catch {
    return Response.json({ error: "Teams are unavailable right now." }, { status: 503 });
  }
}
