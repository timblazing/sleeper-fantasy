import { classifyLookupFailure } from "@/lib/account-lookup";
import { getClientAddress, rateLimited } from "@/lib/client-address";
import { createRequestRateLimiter } from "@/lib/request-rate-limit";
import { getNflLeaguesForUsername } from "@/lib/sleeper";

// A username lookup fans out to one Sleeper league read per league the user is in, so it gets its
// own budget rather than sharing the trade calculator's.
const limiter = createRequestRateLimiter(30);

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim() ?? "";
  if (!username || username.length > 50) {
    return Response.json({ error: "Enter a valid Sleeper username." }, { status: 400 });
  }

  if (!limiter.isAllowed(getClientAddress(request.headers))) return rateLimited("Too many lookups. Try again shortly.");

  try {
    const account = await getNflLeaguesForUsername(username);
    if (account.leagues.length === 0) {
      return Response.json({ error: `No NFL leagues were found for ${account.username} this season.` }, { status: 404 });
    }
    return Response.json(account);
  } catch (error) {
    const failure = classifyLookupFailure(error);
    return Response.json({ error: failure.error }, { status: failure.status });
  }
}
