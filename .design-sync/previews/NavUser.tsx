import { NavUser } from "sleeper-fantasy-dashboard";
import { InShell, Panel } from "./_fixtures/a-shell";

export const ConnectedManager = () => <InShell><Panel><NavUser user={{ name: "clayb", avatar: "" }} /></Panel></InShell>;

export const LongDisplayName = () => <InShell><Panel><NavUser user={{ name: "gridirongreg_dynasty_champ", avatar: "" }} /></Panel></InShell>;

export const NotConnected = () => <InShell><Panel><NavUser user={{ name: "Sleeper", avatar: "" }} /></Panel></InShell>;
