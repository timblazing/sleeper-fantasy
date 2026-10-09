import type { Metadata } from "next";

import { DraftWorkspace } from "@/components/draft-workspace";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { getDraftGradeData } from "@/lib/draft-grades";

export const metadata: Metadata = { title: "Draft Insights" };

export default async function DraftPage({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<{ draft?: string | string[]; username?: string | string[] }> }) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const requested = typeof query.draft === "string" ? query.draft : undefined;
  const data = await getDraftGradeData(leagueId, requested);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        description={
          data.selectedDraftId
            ? `${data.selectedLabel} graded pick by pick`
            : "Every completed draft in this league, graded pick by pick"
        }
        title="Draft Insights"
      />

      <DraftWorkspace basePath={`/${leagueId}/draft-insights`} data={data} username={typeof query.username === "string" ? query.username : undefined} />
    </PageContainer>
  );
}
