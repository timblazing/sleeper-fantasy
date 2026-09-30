import { NavMain } from "sleeper-fantasy-dashboard";
import { InShell, Panel } from "./_fixtures/a-shell";
import { mainItems } from "./_fixtures/a-nav";

export const DashboardActive = () => <InShell><Panel><NavMain items={mainItems(null)} /></Panel></InShell>;

export const PlayersActive = () => <InShell><Panel><NavMain items={mainItems("players")} /></Panel></InShell>;

export const WithGroupLabel = () => <InShell><Panel><NavMain label="Platform" items={mainItems("league")} /></Panel></InShell>;
