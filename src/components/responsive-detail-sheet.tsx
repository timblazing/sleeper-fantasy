"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export function ResponsiveDetailSheet({ children, title, fallbackHref, intercepted = false, open = true, onOpenChange }: { children: ReactNode; title: string; fallbackHref?: string; intercepted?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  return <Sheet open={open} onOpenChange={next => {
    if (onOpenChange) onOpenChange(next);
    else if (!next) {
      if (intercepted) router.back();
      else router.replace(fallbackHref ?? "/");
    }
  }}>
    <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "data-[side=bottom]:h-[94dvh] max-h-[94dvh] gap-0 overflow-hidden rounded-t-2xl bg-background" : "gap-0 overflow-hidden bg-background"}>
      <SheetTitle className="sr-only">{title}</SheetTitle>
      <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-muted-foreground/30 md:hidden" aria-hidden />
      {children}
    </SheetContent>
  </Sheet>;
}
