import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared width and responsive padding for every primary page surface. */
export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full min-w-0 max-w-[1600px] p-4 md:p-6 lg:p-7", className)}>{children}</div>;
}
