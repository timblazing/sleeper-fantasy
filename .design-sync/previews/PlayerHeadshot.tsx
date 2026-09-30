import { PlayerHeadshot } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";

const PICKS: [string, string, string][] = [
  ["9509", "RB", "Bijan Robinson"],
  ["7564", "WR", "Ja'Marr Chase"],
  ["4984", "QB", "Josh Allen"],
  ["11604", "TE", "Brock Bowers"],
];

export const DraftedPlayers = () => (
  <Stage className="flex flex-col gap-3">
    {PICKS.map(([id, pos, name]) => (
      <div key={id} className="flex items-center gap-3 text-sm">
        <PlayerHeadshot playerId={id} position={pos} />
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground">{pos}</span>
      </div>
    ))}
  </Stage>
);

// Unknown ids (pre-cache rookies) fall back to position initials.
export const PositionFallback = () => (
  <Stage className="flex items-center gap-3">
    <PlayerHeadshot playerId="0000001" position="QB" />
    <PlayerHeadshot playerId="0000002" position="RB" />
    <PlayerHeadshot playerId="0000003" position="WR" />
    <PlayerHeadshot playerId="0000004" position="DEF" />
    <PlayerHeadshot playerId="0000005" position={null as unknown as string} />
  </Stage>
);

export const Sizes = () => (
  <Stage className="flex items-center gap-3">
    <PlayerHeadshot playerId="9493" position="WR" className="size-6" />
    <PlayerHeadshot playerId="9493" position="WR" />
    <PlayerHeadshot playerId="9493" position="WR" className="size-10" />
  </Stage>
);
