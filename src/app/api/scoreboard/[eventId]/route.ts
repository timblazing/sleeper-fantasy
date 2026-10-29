import { getClientAddress, rateLimited } from "@/lib/client-address";
import { getNflGameSummary } from "@/lib/nfl-scoreboard-server";
import { createRequestRateLimiter } from "@/lib/request-rate-limit";

// Unlike the scoreboard, each distinct event id is its own ESPN read, so sweeping ids would
// bypass the shared cache. An open game dialog polls 20 times per window; this allows several.
const limiter = createRequestRateLimiter(120);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  if (!/^\d{1,12}$/.test(eventId))
    return Response.json({ error: "Invalid game ID." }, { status: 400 });
  if (!limiter.isAllowed(getClientAddress(request.headers)))
    return rateLimited("Too many game detail requests. Try again shortly.");
  try {
    return Response.json(await getNflGameSummary(eventId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Game details are temporarily unavailable. Please try again." },
      { status: 502 },
    );
  }
}
