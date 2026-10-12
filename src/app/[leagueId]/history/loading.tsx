import { PageContainer } from "@/components/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <PageContainer className="flex flex-col gap-5">
    <Skeleton className="h-9 w-48" />
    <Skeleton className="h-5 w-full max-w-2xl" />
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-96 w-full" />
    <Skeleton className="h-64 w-full" />
  </PageContainer>;
}
