import { HistoryRecords } from "sleeper-fantasy-dashboard";
import { LEAGUE_ID, MANAGERS, RECORDS, RECORDS_EARLY } from "./_fixtures/c-history";
import { Stage } from "./_fixtures/stage";

export const FullRecordBook = () => (
  <Stage><HistoryRecords leagueId={LEAGUE_ID} managers={MANAGERS} records={RECORDS} username="clayb" /></Stage>
);

export const EarlyLeague = () => (
  <Stage><HistoryRecords leagueId={LEAGUE_ID} managers={MANAGERS} records={RECORDS_EARLY} /></Stage>
);
