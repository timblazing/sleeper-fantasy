import { SurplusBar } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";

const Row = ({ label, surplus, scale = 4000 }: { label: string; surplus: number; scale?: number }) => (
  <div className="flex items-center gap-3 text-sm">
    <span style={{ width: 150 }} className="truncate">{label}</span>
    <div style={{ width: 160 }}><SurplusBar surplus={surplus} scale={scale} /></div>
    <span className={`tabular-nums ${surplus > 0 ? "text-positive" : surplus < 0 ? "text-negative" : "text-muted-foreground"}`}>{surplus > 0 ? "+" : ""}{surplus.toLocaleString("en-US")}</span>
  </div>
);

export const Gain = () => <Stage><Row label="Fourth & Long" surplus={2884} /></Stage>;

export const Loss = () => <Stage><Row label="Tank Commander" surplus={-1682} /></Stage>;

export const Distribution = () => (
  <Stage className="flex flex-col gap-2">
    <Row label="Fourth & Long" surplus={2884} />
    <Row label="Turf Monsters" surplus={1540} />
    <Row label="Bijan Mustard" surplus={312} />
    <Row label="Brock Solid" surplus={0} />
    <Row label="Kyren Kingdom" surplus={-740} />
    <Row label="Tank Commander" surplus={-1682} />
    <Row label="Run CMC" surplus={-3920} />
  </Stage>
);
