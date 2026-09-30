import { SeasonTimelineCard } from "sleeper-fantasy-dashboard";
import { TIMELINE_DEADLINE, TIMELINE_PLAYOFFS, TIMELINE_PRESEASON, TIMELINE_REGULAR } from "./_fixtures/c-history";
import { Stage } from "./_fixtures/stage";

export const RegularSeason = () => <Stage><SeasonTimelineCard timeline={TIMELINE_REGULAR} /></Stage>;

export const DeadlineWindow = () => <Stage><SeasonTimelineCard timeline={TIMELINE_DEADLINE} /></Stage>;

export const Playoffs = () => <Stage><SeasonTimelineCard timeline={TIMELINE_PLAYOFFS} /></Stage>;

export const Preseason = () => <Stage><SeasonTimelineCard timeline={TIMELINE_PRESEASON} /></Stage>;
