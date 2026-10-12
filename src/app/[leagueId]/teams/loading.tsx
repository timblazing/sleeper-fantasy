import { PageContainer } from "@/components/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <PageContainer className="flex flex-col gap-5">
    <Skeleton className="h-9 w-48" />
    <Skeleton className="h-5 w-full max-w-2xl" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <Skeleton className="h-36 w-full" key={index} />)}</div>
  </PageContainer>;
}
