import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared width and responsive padding for every primary page surface. */
export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1288px] p-4 md:p-6", className)}>{children}</div>;
}
