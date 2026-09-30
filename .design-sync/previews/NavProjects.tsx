import { NavProjects } from "sleeper-fantasy-dashboard";
import { InShell, Panel } from "./_fixtures/a-shell";
import { toolItems } from "./_fixtures/a-nav";

export const ToolsGroup = () => <InShell><Panel><NavProjects projects={toolItems(null)} /></Panel></InShell>;

export const TradeCalculatorActive = () => <InShell><Panel><NavProjects projects={toolItems("trade")} /></Panel></InShell>;
