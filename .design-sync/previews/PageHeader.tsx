import { PageHeader } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";

export const Dashboard = () => (
  <Stage><PageHeader title="Dashboard" description="This week at a glance — your matchup and what needs attention." /></Stage>
);

export const League = () => (
  <Stage><PageHeader title="League" description="Gridiron Legends Dynasty at a glance — activity, scarcity, the playoff race, and the league record book." /></Stage>
);

export const TradeCalculator = () => (
  <Stage><PageHeader title="Trade Calculator" description="Stage both sides of a deal and grade it against live market values." /></Stage>
);
