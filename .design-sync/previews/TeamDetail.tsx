import { useLayoutEffect, useRef, type ReactNode } from "react";
import { TeamDetail } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";
import { LEAGUE_ID } from "./_fixtures/league";
import { TEAM_CONTENDER, TEAM_REBUILDER } from "./_fixtures/e-team";

const common = { leagueId: LEAGUE_ID, leagueName: "Sunday Syndicate", season: "2026", teams: 12 };

/** The roster tab has no prop to preselect it; activate it the way a reader would. */
function OnRosterTab({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const tab = [...(ref.current?.querySelectorAll<HTMLElement>("[role=tab]") ?? [])].find((el) => el.textContent === "Roster");
    tab?.click();
  }, []);
  return <div ref={ref}>{children}</div>;
}

export const Contender = () => <Stage><TeamDetail {...common} team={TEAM_CONTENDER} valuesReady /></Stage>;

export const Rebuilder = () => <Stage><TeamDetail {...common} team={TEAM_REBUILDER} valuesReady /></Stage>;

export const RosterTab = () => <Stage><OnRosterTab><TeamDetail {...common} team={TEAM_CONTENDER} valuesReady /></OnRosterTab></Stage>;

export const ValuesUnavailable = () => <Stage><TeamDetail {...common} team={TEAM_REBUILDER} valuesReady={false} /></Stage>;
