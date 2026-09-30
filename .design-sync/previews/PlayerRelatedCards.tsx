import { PlayerRelatedCards } from "sleeper-fantasy-dashboard";
import { CMC, D_LEAGUE_ID, PUKA } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

export const YoungStar = () => <Stage><PlayerRelatedCards leagueId={D_LEAGUE_ID} related={PUKA.related} /></Stage>;

export const AgingVeteran = () => <Stage><PlayerRelatedCards leagueId={D_LEAGUE_ID} related={CMC.related} /></Stage>;
