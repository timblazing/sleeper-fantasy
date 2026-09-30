import { PositionBadge } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";

export const Positions = () => (
  <Stage className="flex items-center gap-2">
    <PositionBadge position="QB" />
    <PositionBadge position="RB" />
    <PositionBadge position="WR" />
    <PositionBadge position="TE" />
  </Stage>
);

export const PositionalRank = () => (
  <Stage className="flex items-center gap-2">
    <PositionBadge position="QB" label="QB3" />
    <PositionBadge position="RB" label="RB1" />
    <PositionBadge position="WR" label="WR12" />
    <PositionBadge position="TE" label="TE2" />
  </Stage>
);

export const OtherPositions = () => (
  <Stage className="flex items-center gap-2">
    <PositionBadge position="K" />
    <PositionBadge position="DEF" />
    <PositionBadge position={null} />
  </Stage>
);
