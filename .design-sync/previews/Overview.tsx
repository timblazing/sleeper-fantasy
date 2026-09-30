import { Overview } from "sleeper-fantasy-dashboard";
import { OVERVIEW, OVERVIEW_GUEST, OVERVIEW_QUIET } from "./_fixtures/b-overview";

// Page-scale: Overview brings its own PageContainer padding, so no Stage wrapper.
export const ConnectedLiveWeek = () => <Overview data={OVERVIEW} />;

export const NoAccountConnected = () => <Overview data={OVERVIEW_GUEST} />;

export const QuietPregameWeek = () => <Overview data={OVERVIEW_QUIET} />;

export const NoMatchupScheduled = () => <Overview data={{ ...OVERVIEW, state: { ...OVERVIEW.state, matchupWeek: 1, regularSeason: false, seasonType: "pre" }, matchup: null, matchupEdge: null }} />;
