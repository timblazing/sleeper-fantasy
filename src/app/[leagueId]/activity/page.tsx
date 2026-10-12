import type { Metadata } from "next";
import { ActivityFeed, parseActivityFilter } from "@/components/activity-feed";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { getTransactionFeed, toActivityItem } from "@/lib/transaction-feed";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<{ username?: string | string[]; type?: string | string[] }> }) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const username = typeof query.username === "string" ? query.username : undefined;
  const entries = await getTransactionFeed(leagueId, 100).catch(() => []);

  return (
    <PageContainer className="flex flex-col gap-5">
      <PageHeader title="Activity" description="Every trade, waiver claim, and free agent move in the league this season, newest first." />
      <ActivityFeed filter={parseActivityFilter(query.type)} items={entries.map(toActivityItem)} leagueId={leagueId} username={username} />
    </PageContainer>
  );
}
