import { RankingsTable } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";
import { RANKINGS_QUERY, RANKINGS_ROWS, RANKINGS_VIEW } from "./_fixtures/rankings";

const Frame = ({ children }: { children: React.ReactNode }) => <Stage>{children}</Stage>;

export const DynastyBoard = () => <Frame><RankingsTable query={RANKINGS_QUERY} view={RANKINGS_VIEW} /></Frame>;

// Redraft values are projected points per game above replacement (one decimal), not market value.
const REDRAFT_PPG: Record<string, number> = { "7564": 9.4, "9493": 8.1, "6794": 7.6, "9488": 5.2 };
const REDRAFT_ROWS = RANKINGS_ROWS.filter((r) => r.kind === "player" && r.position === "WR")
  .map((r, i) => ({ ...r, rank: i + 1, value: REDRAFT_PPG[r.kind === "player" ? r.sleeperId : ""] ?? 4, trend7d: 0 }));

export const RedraftBoard = () => (
  <Frame>
    <RankingsTable
      query={{ ...RANKINGS_QUERY, position: "WR" }}
      view={{ ...RANKINGS_VIEW, basis: "redraft", presetLabel: "PPR", rows: REDRAFT_ROWS, total: 4, totalLabel: "4 players", totalPages: 1, maxValue: 9.4 }}
    />
  </Frame>
);

export const NoMatches = () => (
  <Frame>
    <RankingsTable query={{ ...RANKINGS_QUERY, position: "TE", search: "kyren" }} view={{ ...RANKINGS_VIEW, rows: [], total: 0, totalLabel: "0 players", totalPages: 0 }} />
  </Frame>
);
