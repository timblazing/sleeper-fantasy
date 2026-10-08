import type { Metadata } from "next";
import { TeamProfileSheet } from "@/components/team/team-profile-sheet";
import LeaguePage from "../../league/page";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage({ params, searchParams }: { params: Promise<{ leagueId: string; rosterId: string }>; searchParams: Promise<{ username?: string | string[] }> }) {
  const [{ leagueId, rosterId }, query] = await Promise.all([params, searchParams]);
  const username = typeof query.username === "string" ? query.username : undefined;
  return <><LeaguePage params={Promise.resolve({ leagueId })} searchParams={searchParams} /><TeamProfileSheet leagueId={leagueId} rosterId={rosterId} username={username} /></>;
}
