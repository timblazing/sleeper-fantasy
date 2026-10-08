import { Skeleton } from "@/components/ui/skeleton";

export default function PlayerProfileLoading() {
  return (
    <div className="ml-auto flex w-full max-w-[680px] flex-col gap-6 p-5 md:p-7" role="status" aria-label="Loading player">
      <div className="flex items-center gap-4"><Skeleton className="size-20 rounded-full" /><div className="flex-1 space-y-3"><Skeleton className="h-7 w-3/4" /><Skeleton className="h-4 w-1/3" /></div></div>
      <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }, (_, index) => <Skeleton className="h-9" key={index} />)}</div>
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-3 gap-4 border-b pb-6">{Array.from({ length: 3 }, (_, index) => <Skeleton className="h-14" key={index} />)}</div>
      <div className="space-y-5">{Array.from({ length: 6 }, (_, index) => <Skeleton className="h-12" key={index} />)}</div>
    </div>
  );
}
