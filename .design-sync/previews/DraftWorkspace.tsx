import { DraftWorkspace } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";
import { LEAGUE_ID } from "./_fixtures/league";
import { DRAFT_DATA, DRAFT_DATA_EMPTY, DRAFT_DATA_REDRAFT } from "./_fixtures/e-draft";

const BASE = `/${LEAGUE_ID}/draft`;

export const RookieDraftLeaderboard = () => <Stage><DraftWorkspace data={DRAFT_DATA} basePath={BASE} /></Stage>;

export const SlotCurveUnavailable = () => <Stage><DraftWorkspace data={{ ...DRAFT_DATA, curveBacked: false }} basePath={BASE} /></Stage>;

export const RedraftStartup = () => <Stage><DraftWorkspace data={DRAFT_DATA_REDRAFT} basePath={BASE} /></Stage>;

export const NoCompletedDraft = () => <Stage><DraftWorkspace data={DRAFT_DATA_EMPTY} basePath={BASE} /></Stage>;
