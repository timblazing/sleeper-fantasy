import { PlayerProfileSheet } from "@/components/player/player-profile-sheet";
export default async function InterceptedPlayerPage({ params, searchParams }: { params: Promise<{ leagueId: string; sleeperId: string }>; searchParams: Promise<{ username?: string | string[] }> }) {
  const [{ leagueId, sleeperId }, query] = await Promise.all([params, searchParams]);
  return <PlayerProfileSheet intercepted leagueId={leagueId} sleeperId={sleeperId} username={typeof query.username === "string" ? query.username : undefined} />;
}
