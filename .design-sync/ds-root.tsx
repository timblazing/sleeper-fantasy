// Root wrapper the app's layout provides: dark theme, Geist fonts, page background, tooltip context.
import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function DsRoot({ className, children }: { className?: string; children?: React.ReactNode }) {
  // The app sets `dark` on <html>; dialogs, sheets, menus and tooltips portal to <body>, outside
  // this wrapper, so mirror the class on the document root too.
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  }, []);
  return (
    <TooltipProvider>
      <div className={cn("dark bg-background text-foreground font-sans antialiased", className)} style={{ colorScheme: "dark" }}>
        {children}
      </div>
    </TooltipProvider>
  );
}
