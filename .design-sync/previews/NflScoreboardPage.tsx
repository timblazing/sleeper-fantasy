import { NflScoreboardPage } from "sleeper-fantasy-dashboard";
import { SCOREBOARD_EMPTY, SCOREBOARD_PREGAME, SCOREBOARD_SUNDAY, SCOREBOARD_WRAPPED, stubScoreboardFetch } from "./_fixtures/b-scoreboard";

// The page takes no props: it polls /api/scoreboard. Each cell answers that request from a fixture
// (stub installed during render, before the page's effect fires). Page-scale — no Stage wrapper.
const WithScoreboard = ({ reply }: { reply: Parameters<typeof stubScoreboardFetch>[0] }) => {
  stubScoreboardFetch(reply);
  return <NflScoreboardPage />;
};

export const SundayAfternoon = () => <WithScoreboard reply={{ body: SCOREBOARD_SUNDAY }} />;

export const BeforeKickoff = () => <WithScoreboard reply={{ body: SCOREBOARD_PREGAME }} />;

export const AllFinal = () => <WithScoreboard reply={{ body: SCOREBOARD_WRAPPED }} />;

export const NoGamesScheduled = () => <WithScoreboard reply={{ body: SCOREBOARD_EMPTY }} />;

export const Loading = () => <WithScoreboard reply="pending" />;

export const EspnUnavailable = () => <WithScoreboard reply={{ status: 503 }} />;
