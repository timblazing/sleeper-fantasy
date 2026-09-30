import { PlayerPercentiles } from "sleeper-fantasy-dashboard";
import { CMC, PUKA } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

export const EliteWideReceiver = () => <Stage><PlayerPercentiles metrics={PUKA.rankMetrics} position="WR" season={PUKA.rankSeason} /></Stage>;

export const DecliningRunningBack = () => <Stage><PlayerPercentiles metrics={CMC.rankMetrics} position="RB" season={CMC.rankSeason} /></Stage>;
