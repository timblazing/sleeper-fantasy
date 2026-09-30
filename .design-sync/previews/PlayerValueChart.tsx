import "./_fixtures/still-charts";
import { PlayerValueChart } from "sleeper-fantasy-dashboard";
import { CMC, PUKA, ROOKIE } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

export const RisingSuperflex = () => <Stage><PlayerValueChart history={PUKA.history} isSuperflex valueHistory={PUKA.valueHistory} /></Stage>;

export const Falling1qb = () => <Stage><PlayerValueChart history={CMC.history} isSuperflex={false} valueHistory={CMC.valueHistory} /></Stage>;

export const RookieNoCareer = () => <Stage><PlayerValueChart history={ROOKIE.history} isSuperflex valueHistory={ROOKIE.valueHistory} /></Stage>;
