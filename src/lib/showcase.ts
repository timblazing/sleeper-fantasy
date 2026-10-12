import { getLeagueChrome, type LeagueChrome } from "@/lib/league-chrome";
import { getNflLeaguesForUsername } from "@/lib/sleeper";
import { getOverviewData, type OverviewData } from "@/lib/team-insights";

// The connect screen blurs a real dashboard behind its dialog rather than an empty
// frame, so it needs a league nobody has to be signed in to read.
const SHOWCASE_USERNAME = "TimBlazing";

/** The demo league's id for the landing page link; `null` when Sleeper cannot supply it. */
export async function getShowcaseLeagueId(): Promise<string | null> {
  try {
    return (await getNflLeaguesForUsername(SHOWCASE_USERNAME))?.leagues[0]?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * `null` when Sleeper cannot supply the backdrop league. `/` is the only host of the
 * connect dialog, so a decorative backdrop must never be able to 500 the entry page.
 */
export async function getShowcase(): Promise<{ league: LeagueChrome; data: OverviewData } | null> {
  try {
    const account = await getNflLeaguesForUsername(SHOWCASE_USERNAME);
    const leagueId = account?.leagues[0]?.id;
    if (!leagueId) return null;
    const [league, data] = await Promise.all([
      getLeagueChrome(leagueId),
      getOverviewData(leagueId, SHOWCASE_USERNAME),
    ]);
    return { league, data };
  } catch {
    return null;
  }
}
