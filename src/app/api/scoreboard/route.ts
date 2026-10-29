import { getClientAddress, rateLimited } from "@/lib/client-address";
import { getCurrentNflScoreboard } from "@/lib/nfl-scoreboard-server";
import { createRequestRateLimiter } from "@/lib/request-rate-limit";

// The upstream read is shared server-side, so this only caps how many responses one caller can
// draw: a visible tab polls at most every 30 seconds, so 240 covers several tabs behind one NAT.
const limiter = createRequestRateLimiter(240);

export async function GET(request: Request) {
  if (!limiter.isAllowed(getClientAddress(request.headers))) return rateLimited("Too many scoreboard requests. Try again shortly.");
  try {
    return Response.json(await getCurrentNflScoreboard(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        error:
          "The NFL scoreboard is temporarily unavailable. Please try again.",
      },
      { status: 502 },
    );
  }
}
