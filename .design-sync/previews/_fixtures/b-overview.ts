// Batch B fixtures: a full OverviewData for the dashboard (connected manager "clayb", Fourth & Long)
// plus variants — no connected account, and a quiet week with a single action.
import type { OverviewData, PositionScarcity, RecommendedAction } from "@/lib/team-insights";
import { LEAGUE_ID, MATCHUP_LIVE, MATCHUP_PREGAME, STANDINGS } from "./league";

const L = `/${LEAGUE_ID}`;

export const ACTIONS: RecommendedAction[] = [
  { id: "out-8155", tone: "critical", label: "Injury", title: "Breece Hall is Out", detail: "He is in your RB slot and will not play. Swap in an active RB.", href: `${L}/teams?username=clayb`, cta: "Open rosters" },
  { id: "bye-starters", tone: "warning", label: "Bye week", title: "2 starters on bye", detail: "Justin Jefferson, Brock Bowers have no game this week.", href: `${L}/teams?username=clayb`, cta: "Open rosters" },
  { id: "weak-room", tone: "warning", label: "Trade", title: "Upgrade the TE room", detail: "10th of 12 at TE (4,180 against a 6,925 league average). Your WR surplus (2nd) is the piece to move.", href: `${L}/trade?username=clayb`, cta: "Open trade calculator" },
  { id: "sell-9493", tone: "positive", label: "Sell high", title: "Puka Nacua is up +612 in 7 days", detail: "Now worth 8,940. Shop him while the market is hot.", href: `${L}/trade?username=clayb`, cta: "Open trade calculator" },
  { id: "drop-candidates", tone: "neutral", label: "Waivers", title: "4 bench players below 100 value", detail: "Tyler Boyd, Gus Edwards, Hayden Hurst, …. These are your cheapest roster spots to convert into a waiver claim.", href: `${L}/players?username=clayb`, cta: "See waiver fits" },
];

const row = (index: number, value: number, isUser = false) => ({ rosterId: STANDINGS[index].rosterId, name: STANDINGS[index].name, manager: STANDINGS[index].manager, value, isUser });

export const SCARCITY: PositionScarcity[] = [
  { position: "QB", topThreeShare: 41, rows: [row(3, 16420), row(0, 15890, true), row(6, 12310), row(2, 9870), row(8, 7420)] },
  { position: "RB", topThreeShare: 38, rows: [row(2, 21840), row(9, 19660), row(5, 15120), row(0, 12980, true), row(11, 8440)] },
  { position: "WR", topThreeShare: 35, rows: [row(4, 29310), row(0, 27450, true), row(7, 24020), row(1, 20870), row(10, 14210)] },
  { position: "TE", topThreeShare: 52, rows: [row(1, 11240), row(5, 9760), row(8, 8930), row(3, 6120), row(0, 4180, true)] },
];

const me = STANDINGS[0];

export const OVERVIEW: OverviewData = {
  league: { id: LEAGUE_ID, name: "Gridiron Dynasty League", season: "2026", teams: 12, type: "dynasty", isDynasty: true, superflex: true },
  state: { week: 4, matchupWeek: 4, seasonType: "regular", regularSeason: true },
  username: "clayb",
  team: {
    rosterId: me.rosterId, ownerId: "731245889", name: me.name, manager: me.manager, avatar: null, wins: 3, losses: 0, ties: 0,
    pointsFor: 412.6, pointsAgainst: 351.2, value: 89730, valueRank: 2, powerRank: 1, rooms: [], roster: [], starters: [], taxi: [], reserve: [], players: [],
  },
  outlook: { grade: "A-", label: "Contender", detail: "Top-two roster by value with the league's best offense.", valueRank: 2, powerRank: 1, teams: 12, ppg: 137.5 },
  rooms: [],
  matchup: MATCHUP_LIVE,
  matchupEdge: { mine: 64210, theirs: 58930 },
  topAssets: [],
  insights: [],
  actions: ACTIONS,
  positionScarcity: SCARCITY,
  activity: [],
  valuesReady: true,
  metrics: [
    { id: "record", label: "Record", value: "3–0", detail: "3 games played", tone: "neutral" },
    { id: "ppg", label: "Points per game", value: "137.5", detail: "412.6 scored", tone: "neutral" },
    { id: "power", label: "Power rank", value: "1st", detail: "of 12 by scoring", tone: "positive" },
    { id: "differential", label: "Differential", value: "+61.4", detail: "351.2 allowed", tone: "positive" },
  ],
  phase: { label: "Regular season", tone: "positive", detail: "Set lineups weekly, work the waiver wire, and track buy-low windows while prices are soft." },
  timeline: {
    startWeek: 1, endWeek: 17, currentWeek: 4,
    phase: { label: "Regular season", tone: "positive", detail: "Set lineups weekly, work the waiver wire, and track buy-low windows while prices are soft." },
    markers: [
      { id: "kickoff", label: "Kickoff", week: 1, state: "past" },
      { id: "deadline", label: "Trade deadline", week: 11, state: "upcoming" },
      { id: "playoffs", label: "Playoffs", week: 15, state: "upcoming" },
      { id: "championship", label: "Championship", week: 17, state: "upcoming" },
    ],
  },
};

/** No ?username= connected: the hero becomes a connect prompt, the matchup is the league's first, no actions. */
export const OVERVIEW_GUEST: OverviewData = { ...OVERVIEW, username: undefined, team: null, outlook: null, matchup: MATCHUP_PREGAME, matchupEdge: null, actions: [], metrics: [] };

/** A quiet week: one low-stakes action, and a dynasty-flavored metric strip. */
export const OVERVIEW_QUIET: OverviewData = {
  ...OVERVIEW,
  matchup: MATCHUP_PREGAME,
  actions: [ACTIONS[4]],
  metrics: [
    { id: "value", label: "Team value", value: "89.7K", detail: "2nd of 12", tone: "positive" },
    { id: "grade", label: "Roster grade", value: "A-", detail: "Contender", tone: "positive" },
    { id: "weakest", label: "Weakest spot", value: "TE", detail: "10th of 12", tone: "warning" },
    { id: "strongest", label: "Strongest spot", value: "WR", detail: "2nd of 12", tone: "positive" },
  ],
};

/** A manager whose team isn't in the top five anywhere — no highlighted row in the scarcity table. */
export const SCARCITY_NO_USER: OverviewData = { ...OVERVIEW, positionScarcity: SCARCITY.map((s) => ({ ...s, rows: s.rows.map((r) => ({ ...r, isUser: false })) })) };
