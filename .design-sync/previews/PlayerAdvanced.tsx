import { PlayerAdvanced } from "sleeper-fantasy-dashboard";
import { CMC, PUKA } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

export const WideReceiver = () => <Stage><PlayerAdvanced advanced={PUKA.advanced} /></Stage>;

export const RunningBack = () => <Stage><PlayerAdvanced advanced={CMC.advanced} /></Stage>;
