import { getClientAddress, rateLimited } from "@/lib/client-address";
import { isLeagueId } from "@/lib/league-id";
import { searchMarketPlayers } from "@/lib/player-market";
import { createRequestRateLimiter } from "@/lib/request-rate-limit";

// A search rebuilds the league value context (a live roster read) and, for dynasty leagues, calls
// RosterAudit. The trade calculator and command palette search on a 150–250ms debounce, so a
// person typing a few names legitimately sends dozens; this bounds scripted use, not typing.
const limiter = createRequestRateLimiter(120);

export async function GET(request: Request, context: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await context.params;
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (!isLeagueId(leagueId)) {
    return Response.json({ error: "Invalid league id." }, { status: 400 });
  }

  if (!query || query.length > 80) {
    return Response.json({ error: "Enter a valid player name." }, { status: 400 });
  }

  if (!limiter.isAllowed(getClientAddress(request.headers))) return rateLimited("Too many searches. Try again shortly.");

  try {
    const players = await searchMarketPlayers(leagueId, query);
    return Response.json({ players });
  } catch {
    return Response.json({ error: "Player search is unavailable right now." }, { status: 503 });
  }
}
