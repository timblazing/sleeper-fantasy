import { getClientAddress, rateLimited } from "@/lib/client-address";
import { isLeagueId } from "@/lib/league-id";
import { getLeagueBase } from "@/lib/league-context";
import { createRequestRateLimiter } from "@/lib/request-rate-limit";

// Loaded once per palette open per league; the budget only stops scripted league-id sweeps.
const limiter = createRequestRateLimiter(60);

/** The league's teams, for the command palette's lazy first-open load. */
export async function GET(request: Request, context: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await context.params;
  if (!isLeagueId(leagueId)) return Response.json({ error: "Invalid league id." }, { status: 400 });
  if (!limiter.isAllowed(getClientAddress(request.headers))) return rateLimited("Too many requests. Try again shortly.");

  try {
    const base = await getLeagueBase(leagueId);
    const teams = [...base.teamByRoster.values()].map(({ rosterId, name, manager }) => ({ rosterId, name, manager }));
    return Response.json({ teams });
  } catch {
    return Response.json({ error: "Teams are unavailable right now." }, { status: 503 });
  }
}
