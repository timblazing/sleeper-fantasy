import { PositionalScarcityCard } from "sleeper-fantasy-dashboard";
import { OVERVIEW, SCARCITY_NO_USER } from "./_fixtures/b-overview";
import { Stage } from "./_fixtures/stage";

// League page usage: every team ranked per position, the connected manager's row highlighted.
export const ConnectedManager = () => <Stage><PositionalScarcityCard data={OVERVIEW} /></Stage>;

export const NoConnectedTeam = () => <Stage><PositionalScarcityCard data={SCARCITY_NO_USER} /></Stage>;

export const PassCatchersOnly = () => (
  <Stage><PositionalScarcityCard data={{ ...OVERVIEW, positionScarcity: OVERVIEW.positionScarcity.filter((s) => s.position === "WR" || s.position === "TE") }} /></Stage>
);
