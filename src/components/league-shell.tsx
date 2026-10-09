import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { Separator } from "@/components/ui/separator";
import { ScorePlacementChrome } from "@/components/score-placement-chrome";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { LeagueChrome } from "@/lib/league-chrome";

// Shared by the [leagueId] layout and the connect screen, which renders the same
// chrome behind the dialog so the blurred backdrop is the real dashboard.
export function LeagueShell({ children, defaultOpen = true, league }: { children: React.ReactNode; defaultOpen?: boolean; league: LeagueChrome }) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar league={league} />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex min-h-[60px] shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 backdrop-blur-xl transition-[width,height] ease-linear">
          <div className="flex w-full flex-wrap items-center gap-2 px-3 py-2 md:flex-nowrap md:px-4 md:py-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
            <div className="min-w-0 flex-1"><AppBreadcrumb league={league} /></div>
            <div className="w-full min-w-0 md:w-auto md:basis-auto"><ScorePlacementChrome /></div>
          </div>
        </header>
        {children}
        <SiteFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
