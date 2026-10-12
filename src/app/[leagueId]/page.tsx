import type { Metadata } from "next";
import { Overview } from "@/components/overview";
import { getOverviewData } from "@/lib/team-insights";
import { getPlayoffPicture } from "@/lib/playoff-odds";
import { getDashboardPulse } from "@/lib/dashboard-pulse";

export const metadata: Metadata = { title: "Dashboard" };
export default async function LeaguePage({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<{ username?: string | string[] }> }) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const username = typeof query.username === "string" ? query.username : undefined;
  const [data, picture, pulse] = await Promise.all([
    getOverviewData(leagueId, username),
    getPlayoffPicture(leagueId, username),
    getDashboardPulse(leagueId).catch(() => null),
  ]);
  return <Overview data={data} picture={picture} pulse={pulse} />;
}
