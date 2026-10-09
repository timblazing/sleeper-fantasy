import { PageContainer } from "@/components/page-container";
import { Skeleton } from "@/components/ui/skeleton";

// Rendered inside the [leagueId] layout, so only the inset content is replaced.
export default function Loading() { return <PageContainer className="flex flex-col gap-6"><div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]"><Skeleton className="h-[34rem] w-full" /><Skeleton className="h-[34rem] w-full" /></div></PageContainer>; }
