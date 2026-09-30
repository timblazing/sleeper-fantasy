import { PlayerTradeMarketCard } from "sleeper-fantasy-dashboard";
import { CMC, PUKA } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

export const ActiveMarket = () => <Stage><PlayerTradeMarketCard market={PUKA.tradeMarket} /></Stage>;

export const ThinMarket = () => <Stage><PlayerTradeMarketCard market={CMC.tradeMarket} /></Stage>;
