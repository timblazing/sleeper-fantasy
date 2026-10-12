import type { ComponentType } from "react";
import {
  ActivityIcon,
  BandageIcon,
  BinocularsIcon,
  BookOpenIcon,
  ClipboardListIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  ScaleIcon,
  SwordsIcon,
  TrophyIcon,
  UsersRoundIcon,
} from "lucide-react";

// `segment` matches what useSelectedLayoutSegment() reports under the [leagueId] layout;
// null is the index route (Dashboard).
// Every entry renders for every league format. Pages that quote player values quote them in the
// league's own basis (`src/lib/value-basis.ts`) rather than hiding themselves.
export type NavEntry = { title: string; segment: string | null; icon: ComponentType<{ className?: string }> };

export const leagueNav: NavEntry[] = [
  { title: "Dashboard", segment: null, icon: LayoutDashboardIcon },
  { title: "Matchups", segment: "matchups", icon: SwordsIcon },
  { title: "Standings", segment: "standings", icon: TrophyIcon },
  { title: "Teams", segment: "teams", icon: UsersRoundIcon },
  { title: "Activity", segment: "activity", icon: ActivityIcon },
  { title: "History", segment: "history", icon: HistoryIcon },
];

export const playersNav: NavEntry[] = [
  { title: "Rankings", segment: "players", icon: ListOrderedIcon },
  { title: "Injuries", segment: "injuries", icon: BandageIcon },
];

export const toolsNav: NavEntry[] = [
  { title: "Trade Calculator", segment: "trade", icon: ScaleIcon },
  { title: "Scouting Report", segment: "scouting-report", icon: BinocularsIcon },
  { title: "Draft Insights", segment: "draft-insights", icon: ClipboardListIcon },
];

// Rendered in the sidebar footer's link list, below GitHub, rather than with the Tools.
export const resourcesNav: NavEntry = { title: "Resources", segment: "resources", icon: BookOpenIcon };

export function navTitle(segment: string | null): string {
  return [...leagueNav, ...playersNav, ...toolsNav, resourcesNav].find((entry) => entry.segment === segment)?.title ?? "Dashboard";
}
