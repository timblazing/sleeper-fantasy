import type { Metadata } from "next";
import PlayersPage from "../page";
import { PlayerProfileSheet } from "@/components/player/player-profile-sheet";
import { getPlayerProfile } from "@/lib/player-profile";

export async function generateMetadata({ params }: { params: Promise<{ sleeperId: string }> }): Promise<Metadata> {
  const { sleeperId } = await params;
  const result = await getPlayerProfile(sleeperId);
  if (!result.ok) return { title: "Player" };
  const { player, value } = result.data;
  return {
    title: player.name,
    description: `${player.name} — ${player.position}${value.rankPositionSf ?? ""} · ${value.valueSf.toLocaleString("en-US")} dynasty value in superflex.`,
  };
}

export default async function PlayerPage({ params, searchParams }: { params: Promise<{ leagueId: string; sleeperId: string }>; searchParams: Promise<{ username?: string | string[] }> }) {
  const [{ leagueId, sleeperId }, query] = await Promise.all([params, searchParams]);
  const username = typeof query.username === "string" ? query.username : undefined;
  return <><PlayersPage params={Promise.resolve({ leagueId })} searchParams={searchParams} /><PlayerProfileSheet leagueId={leagueId} sleeperId={sleeperId} username={username} /></>;
}
