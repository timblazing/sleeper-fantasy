import type { Metadata } from "next";
import { Overview } from "@/components/overview";
import { getOverviewData } from "@/lib/team-insights";
import { getLeagueHistory } from "@/lib/league-history";
import { getPlayoffPicture } from "@/lib/playoff-odds";

export const metadata: Metadata = { title: "Dashboard" };
export default async function LeaguePage({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<{ username?: string | string[] }> }) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const username = typeof query.username === "string" ? query.username : undefined;
  const [data, picture, history] = await Promise.all([
    getOverviewData(leagueId, username),
    getPlayoffPicture(leagueId, username),
    getLeagueHistory(leagueId).catch(() => null),
  ]);
  return <Overview data={data} history={history} picture={picture} />;
}
