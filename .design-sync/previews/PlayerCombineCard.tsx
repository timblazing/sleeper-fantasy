import { PlayerCombineCard } from "sleeper-fantasy-dashboard";
import { CMC, PUKA, ROOKIE } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

const Frame = ({ children }: { children: React.ReactNode }) => <Stage><div className="max-w-2xl">{children}</div></Stage>;

export const DayThreePick = () => <Frame><PlayerCombineCard combine={PUKA.combine} /></Frame>;

export const TopTenPick = () => <Frame><PlayerCombineCard combine={CMC.combine} /></Frame>;

export const PartialTesting = () => <Frame><PlayerCombineCard combine={ROOKIE.combine} /></Frame>;
