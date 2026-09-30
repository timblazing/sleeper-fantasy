import { KickoffTime } from "sleeper-fantasy-dashboard";
import { KICKOFF_NEXT_MONTH, KICKOFF_THIS_WEEK, KICKOFF_TODAY } from "./_fixtures/b-matchups";
import { Stage } from "./_fixtures/stage";

// KickoffTime is an inline label; show it the way the lineup rows use it — under a player name.
const Row = ({ name, kickoff, fallback }: { name: string; kickoff: string; fallback: string }) => (
  <div className="flex max-w-xs flex-col gap-0.5 rounded-lg bg-muted/40 px-3 py-2">
    <p className="text-sm font-medium">{name}</p>
    <p className="text-xs text-muted-foreground"><KickoffTime kickoff={kickoff} fallback={fallback} /></p>
  </div>
);

export const LaterToday = () => <Stage><Row name="Ja'Marr Chase" kickoff={KICKOFF_TODAY} fallback="Sun 4:25 PM EDT" /></Stage>;

export const ThisWeek = () => <Stage><Row name="Brock Bowers" kickoff={KICKOFF_THIS_WEEK} fallback="Mon 8:15 PM EDT" /></Stage>;

export const LaterDate = () => <Stage><Row name="Justin Jefferson" kickoff={KICKOFF_NEXT_MONTH} fallback="10/15 - 8:15 PM EDT" /></Stage>;

export const FallbackLabel = () => <Stage><Row name="Puka Nacua" kickoff="TBD" fallback="Sun 4:05 PM EDT" /></Stage>;
