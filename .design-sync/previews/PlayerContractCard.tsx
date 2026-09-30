import { PlayerContractCard } from "sleeper-fantasy-dashboard";
import { CMC, PUKA, ROOKIE } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

const Frame = ({ children }: { children: React.ReactNode }) => <Stage><div className="max-w-2xl">{children}</div></Stage>;

export const ExpiringRookieDeal = () => <Frame><PlayerContractCard contract={PUKA.contract} /></Frame>;

export const VeteranExtension = () => <Frame><PlayerContractCard contract={CMC.contract} /></Frame>;

export const FreshRookieDeal = () => <Frame><PlayerContractCard contract={ROOKIE.contract} /></Frame>;
