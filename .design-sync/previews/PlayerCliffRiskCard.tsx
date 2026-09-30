import { PlayerCliffRiskCard } from "sleeper-fantasy-dashboard";
import { CMC, PUKA } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

const Frame = ({ children }: { children: React.ReactNode }) => <Stage><div className="max-w-2xl">{children}</div></Stage>;

export const LowRisk = () => <Frame><PlayerCliffRiskCard cliffRisk={PUKA.cliffRisk} /></Frame>;

export const ModerateRisk = () => (
  <Frame>
    <PlayerCliffRiskCard
      cliffRisk={{
        level: "Moderate", score: 47,
        recommendation: "Hold through this season, then shop him before his age-29 offseason.",
        factors: [
          { factor: "age", severity: "moderate", detail: "27.5 years old — two seasons from the typical WR decline window." },
          { factor: "usage", severity: "low", detail: "Target share is steady at 27%." },
        ],
      }}
    />
  </Frame>
);

export const HighRisk = () => <Frame><PlayerCliffRiskCard cliffRisk={CMC.cliffRisk} /></Frame>;
