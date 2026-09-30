import "./_fixtures/still-charts";
import { PlayerProjection } from "sleeper-fantasy-dashboard";
import { CMC, PUKA } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

export const HoldCornerstone = () => <Stage><PlayerProjection curve={PUKA.projectionCurve} outcome={PUKA.outcome} ppg={PUKA.projectedPpg} ppgPpr={PUKA.projectedPpgPpr} summary={PUKA.projectionSummary} /></Stage>;

export const SellAgingBack = () => <Stage><PlayerProjection curve={CMC.projectionCurve} outcome={CMC.outcome} ppg={CMC.projectedPpg} ppgPpr={CMC.projectedPpgPpr} summary={CMC.projectionSummary} /></Stage>;

export const OutcomesOnly = () => <Stage><PlayerProjection curve={[]} outcome={{ ...PUKA.outcome!, strategy: "buy", archetype: "target_hog", breakoutPct: 58, bustPct: 11 }} ppg={14.2} ppgPpr={null} summary={null} /></Stage>;
