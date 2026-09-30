// Batch A: nav items as AppSidebar builds them (see src/lib/nav.ts), with lucide icons.
import { createElement as h } from "react";
import { AmbulanceIcon, BinocularsIcon, BookOpenIcon, ClipboardListIcon, LayoutDashboardIcon, RadioIcon, ScaleIcon, TrophyIcon, UsersIcon } from "lucide-react";
import { LEAGUE_ID } from "./league";

const item = (title: string, segment: string | null, Icon: typeof TrophyIcon, active: string | null) => ({
  title, url: `/${LEAGUE_ID}${segment ? `/${segment}` : ""}?username=clayb`, icon: h(Icon), isActive: segment === active,
});

export const mainItems = (active: string | null = null) => [
  item("Dashboard", null, LayoutDashboardIcon, active),
  item("Scoreboard", "scoreboard", RadioIcon, active),
  item("League", "league", TrophyIcon, active),
  item("Players", "players", UsersIcon, active),
  item("Draft", "draft", ClipboardListIcon, active),
];

export const toolItems = (active: string | null = null) => [
  item("Trade Calculator", "trade", ScaleIcon, active),
  item("Scouting Report", "scouting-report", BinocularsIcon, active),
  item("Injury Report", "injuries", AmbulanceIcon, active),
  item("Resources", "resources", BookOpenIcon, active),
];
