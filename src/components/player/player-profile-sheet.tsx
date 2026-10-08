import { PlayerDetail } from "@/components/player/player-detail";
import { PlayerSheet } from "@/components/player/player-sheet";
import { getLeagueChrome } from "@/lib/league-chrome";
import { getPlayerLeagueContext } from "@/lib/player-league-context";
import { getPlayerProfile } from "@/lib/player-profile";
import { withUsername } from "@/lib/utils";

export async function PlayerProfileSheet({ leagueId, sleeperId, username, intercepted = false }: { leagueId: string; sleeperId: string; username?: string; intercepted?: boolean }) {
  const [league, result, context] = await Promise.all([getLeagueChrome(leagueId), getPlayerProfile(sleeperId), getPlayerLeagueContext(leagueId, sleeperId, username)]);
  return <PlayerSheet title={result.ok ? result.data.player.name : "Player details"} intercepted={intercepted} fallbackHref={withUsername(`/${leagueId}/players`, username)}>
    {result.ok ? <PlayerDetail context={context} isSuperflex={league.isSuperflex} leagueId={leagueId} profile={result.data} username={username} /> : <div className="px-6 py-16"><h1 className="text-lg font-semibold">Player data unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{result.error.kind === "rate-limited" ? "Too many requests. Wait a minute and reload." : result.error.kind === "invalid-response" ? "The player service returned unexpected data." : "The player service could not load this profile. Reload to try again."}</p></div>}
  </PlayerSheet>;
}
