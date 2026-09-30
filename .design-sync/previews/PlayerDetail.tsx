import "./_fixtures/still-charts";
import { PlayerDetail } from "sleeper-fantasy-dashboard";
import { CMC, CMC_CONTEXT, D_LEAGUE_ID, PUKA, PUKA_CONTEXT } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

export const AscendingWr1 = () => <Stage><PlayerDetail context={PUKA_CONTEXT} isSuperflex leagueId={D_LEAGUE_ID} profile={PUKA} /></Stage>;

export const AgingFreeAgentRb = () => <Stage><PlayerDetail context={CMC_CONTEXT} isSuperflex={false} leagueId={D_LEAGUE_ID} profile={CMC} /></Stage>;
