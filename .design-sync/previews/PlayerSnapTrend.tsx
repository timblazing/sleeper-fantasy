import "./_fixtures/still-charts";
import { PlayerSnapTrend } from "sleeper-fantasy-dashboard";
import { CMC, PUKA } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

export const StableRole = () => <Stage><PlayerSnapTrend avgSnapPct={PUKA.avgSnapPct} snaps={PUKA.snapsWeekly} /></Stage>;

export const ShrinkingRole = () => <Stage><PlayerSnapTrend avgSnapPct={CMC.avgSnapPct} snaps={CMC.snapsWeekly} /></Stage>;
