import { PageContainer } from "@/components/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <PageContainer className="flex flex-col gap-5">
    <Skeleton className="h-9 w-48" />
    <Skeleton className="h-6 w-full max-w-2xl" />
    <Skeleton className="h-9 w-56" />
    <Skeleton className="h-10 w-full" />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Skeleton className="h-[34rem] w-full" /><Skeleton className="h-96 w-full" />
    </div>
  </PageContainer>;
}
