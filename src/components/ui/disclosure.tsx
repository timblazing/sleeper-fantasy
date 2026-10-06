import type { ComponentProps, ReactNode } from "react";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Native keyboard interaction and open state; content stays mounted when collapsed. */
export function Disclosure({ summary, children, className, ...props }: Omit<ComponentProps<"details">, "children"> & { summary: ReactNode; children: ReactNode }) {
  return (
    <details data-slot="disclosure" className={cn("group/disclosure rounded-xl border bg-card [interpolate-size:allow-keywords] [&::details-content]:h-0 [&::details-content]:overflow-clip [&::details-content]:opacity-0 [&::details-content]:transition-[height,opacity,content-visibility] [&::details-content]:duration-250 [&::details-content]:[transition-behavior:allow-discrete] [&[open]::details-content]:h-auto [&[open]::details-content]:opacity-100 motion-reduce:[&::details-content]:transition-none", className)} {...props}>
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-3 focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">{summary}</div>
        <PlusIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform duration-250 group-open/disclosure:rotate-45 motion-reduce:transition-none" />
      </summary>
      <div className="border-t p-3 transition-opacity duration-250 motion-reduce:transition-none">{children}</div>
    </details>
  );
}
