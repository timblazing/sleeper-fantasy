import { TeamSwitcher } from "sleeper-fantasy-dashboard";
import { InShell, Panel } from "./_fixtures/a-shell";
import { LEAGUE_ID } from "./_fixtures/league";

const LEAGUES = [
  { name: "Gridiron Legends Dynasty", plan: "Dynasty", url: `/${LEAGUE_ID}?username=clayb` },
  { name: "Office Pickem Redraft", plan: "Redraft", url: "/1182093341557391360?username=clayb" },
  { name: "Best Ball Mania", plan: "Best Ball", url: "/1179011223344556677?username=clayb" },
];

export const MultipleLeagues = () => (
  <InShell><Panel><TeamSwitcher activeTeam={{ name: "Gridiron Legends Dynasty", plan: "2026 · Dynasty" }} teams={LEAGUES} /></Panel></InShell>
);

export const SingleLeague = () => (
  <InShell><Panel><TeamSwitcher activeTeam={{ name: "Office Pickem Redraft", plan: "2026 · Redraft" }} teams={[]} /></Panel></InShell>
);

export const LongLeagueName = () => (
  <InShell><Panel><TeamSwitcher activeTeam={{ name: "The Annual Thanksgiving Dynasty Superflex League", plan: "2026 · Dynasty" }} teams={LEAGUES} /></Panel></InShell>
);
