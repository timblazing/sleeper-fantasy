import { PlayerInjuryCard } from "sleeper-fantasy-dashboard";
import { CMC, PUKA } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

const Frame = ({ children }: { children: React.ReactNode }) => <Stage><div className="max-w-2xl">{children}</div></Stage>;

export const MostlyHealthy = () => <Frame><PlayerInjuryCard injury={PUKA.injury} /></Frame>;

export const InjuryProne = () => <Frame><PlayerInjuryCard injury={CMC.injury} /></Frame>;

export const CleanRecord = () => <Frame><PlayerInjuryCard injury={{ grade: "A", score: 96, events: [], preNfl: [{ year: 2022, description: "Torn meniscus at Notre Dame — arthroscopic repair, missed spring practice.", significance: "low" }] }} /></Frame>;
