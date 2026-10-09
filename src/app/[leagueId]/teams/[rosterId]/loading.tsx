import { PageContainer } from "@/components/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <PageContainer className="flex flex-col gap-4">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton className="h-36" key={index} />)}
      </div>
    </PageContainer>
  );
}
