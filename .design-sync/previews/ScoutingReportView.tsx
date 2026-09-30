import { ScoutingReportView } from "sleeper-fantasy-dashboard";
import { SCOUTING_REPORT, SCOUTING_REPORT_ANON } from "./_fixtures/c-scouting";

// Page-scale: renders its own padded page container, so no <Stage>. The manager detail pane
// needs a >=1024px window (card viewport override in config).
export const LeagueScout = () => <ScoutingReportView report={SCOUTING_REPORT} />;

export const NotConnected = () => <ScoutingReportView report={SCOUTING_REPORT_ANON} />;
