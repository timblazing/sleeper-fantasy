import { RememberAccount } from "sleeper-fantasy-dashboard";
import { LEAGUE_ID } from "./_fixtures/league";
import { Stage } from "./_fixtures/stage";

// RememberAccount renders nothing: it writes the connected username + last-opened league to a
// cookie so `/` reopens that league. The cell shows where it sits (layout root) and says so.
export const SideEffectOnly = () => (
  <Stage>
    <RememberAccount leagueId={LEAGUE_ID} />
    <div className="max-w-md rounded-xl border border-dashed p-4 text-sm">
      <div className="font-medium">&lt;RememberAccount leagueId="{LEAGUE_ID}" /&gt;</div>
      <p className="mt-1 text-muted-foreground">Renders no UI. Mounted once in the league layout, it remembers the connected Sleeper username and the league last opened, so returning to the home page lands back in Gridiron Legends Dynasty.</p>
    </div>
  </Stage>
);
