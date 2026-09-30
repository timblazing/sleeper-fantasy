import { RankingsPagination } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";
import { LEAGUE_ID } from "./_fixtures/league";
import { RANKINGS_QUERY, RANKINGS_VIEW } from "./_fixtures/rankings";

export const FirstPage = () => <Stage><RankingsPagination leagueId={LEAGUE_ID} query={RANKINGS_QUERY} page={1} totalPages={RANKINGS_VIEW.totalPages} totalLabel={RANKINGS_VIEW.totalLabel} /></Stage>;

export const MiddlePage = () => <Stage><RankingsPagination leagueId={LEAGUE_ID} query={{ ...RANKINGS_QUERY, page: 17 }} page={17} totalPages={48} totalLabel="480 players" /></Stage>;

export const LastPage = () => <Stage><RankingsPagination leagueId={LEAGUE_ID} query={{ ...RANKINGS_QUERY, position: "TE", page: 6 }} page={6} totalPages={6} totalLabel="58 players" /></Stage>;

export const SinglePage = () => <Stage><RankingsPagination leagueId={LEAGUE_ID} query={{ ...RANKINGS_QUERY, position: "picks" }} page={1} totalPages={1} totalLabel="9 picks" /></Stage>;
