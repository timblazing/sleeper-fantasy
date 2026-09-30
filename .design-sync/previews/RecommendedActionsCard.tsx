import { RecommendedActionsCard } from "sleeper-fantasy-dashboard";
import { ACTIONS, OVERVIEW } from "./_fixtures/b-overview";
import { Stage } from "./_fixtures/stage";

const Frame = ({ children }: { children: React.ReactNode }) => <Stage><div className="max-w-3xl">{children}</div></Stage>;

// Dashboard usage: actions ranked critical → neutral, each with a CTA into the right tool.
export const GameDayChecklist = () => <Frame><RecommendedActionsCard data={OVERVIEW} /></Frame>;

export const LineupEmergencies = () => (
  <Frame>
    <RecommendedActionsCard
      data={{
        ...OVERVIEW,
        actions: [
          { id: "empty-slots", tone: "critical", label: "Lineup", title: "Fill 1 empty starting slot", detail: "FLEX is unset and will score zero.", href: `/${OVERVIEW.league.id}/teams`, cta: "Open rosters" },
          ACTIONS[0],
          { id: "risky-starters", tone: "warning", label: "Watch", title: "2 starters carrying an injury tag", detail: "Josh Allen (Questionable), Garrett Wilson (Questionable). Check inactives before kickoff.", href: `/${OVERVIEW.league.id}/teams`, cta: "Open rosters" },
        ],
      }}
    />
  </Frame>
);

export const MarketMoves = () => (
  <Frame>
    <RecommendedActionsCard
      data={{
        ...OVERVIEW,
        actions: [
          ACTIONS[3],
          { id: "falling-7564", tone: "warning", label: "Fading", title: "Ja'Marr Chase has shed -845", detail: "Down to 9,120 over the last week. Decide whether to hold through it or move on.", href: `/${OVERVIEW.league.id}/players`, cta: "Open players" },
        ],
      }}
    />
  </Frame>
);

export const SingleNote = () => <Frame><RecommendedActionsCard data={{ ...OVERVIEW, actions: [ACTIONS[4]] }} /></Frame>;
