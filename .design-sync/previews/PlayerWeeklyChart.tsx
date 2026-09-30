import { PlayerWeeklyChart } from "sleeper-fantasy-dashboard";
import { CMC, PUKA } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

export const ConsistentWr1 = () => <Stage><PlayerWeeklyChart season={PUKA.season} weekly={PUKA.weekly} /></Stage>;

export const FadingRb = () => <Stage><PlayerWeeklyChart season={CMC.season} weekly={CMC.weekly} /></Stage>;
