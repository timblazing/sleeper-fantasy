// Batch A: sidebar leaves (NavMain, NavUser, TeamSwitcher, ...) call useSidebar(), and the only
// SidebarProvider the bundle exposes is LeagueShell's. `InShell` renders LeagueShell but clips
// its own rail + header away (a transformed box is the containing block for the fixed sidebar),
// so the cell shows just the children — with the real sidebar context around them.
import { createElement as h, type ReactNode } from "react";
import { LeagueShell } from "sleeper-fantasy-dashboard";
import type { LeagueChrome } from "@/lib/league-chrome";
import { LEAGUE_CHROME } from "./a-chrome";

export function InShell({ children, height = 520, open = true, league = LEAGUE_CHROME }: { children: ReactNode; height?: number; open?: boolean; league?: LeagueChrome }) {
  const x = open ? "16rem" : "3rem";
  const y = open ? "4rem" : "3rem";
  return h("div", { style: { overflow: "hidden", height } },
    h("div", { style: { transform: `translate(-${x}, -${y})`, width: `calc(100% + ${x})` } },
      h(LeagueShell, { league, defaultOpen: open }, h("div", { className: "p-6" }, children))));
}

/** A static sidebar-coloured panel for a single nav group. */
export const Panel = ({ children }: { children: ReactNode }) =>
  h("div", { className: "w-64 rounded-xl border border-sidebar-border bg-sidebar p-2 text-sidebar-foreground" }, children);
