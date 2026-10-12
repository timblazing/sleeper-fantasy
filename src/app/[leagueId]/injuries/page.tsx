import type { Metadata } from "next";
import { InjuryReportView } from "@/components/injury-report-view";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import type { InjurySearchParams } from "@/lib/injury-query";

export const metadata: Metadata = { title: "Injuries" };

export default async function InjuriesPage({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<InjurySearchParams> }) {
  const [{ leagueId }, rawQuery] = await Promise.all([params, searchParams]);
  return (
    <PageContainer className="flex flex-col gap-5">
      <PageHeader title="Injuries" description="Every injury and practice designation across rostered players, ranked by who it actually costs." />
      <InjuryReportView leagueId={leagueId} rawQuery={rawQuery} />
    </PageContainer>
  );
}
