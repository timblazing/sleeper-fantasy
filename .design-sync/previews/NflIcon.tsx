import { NflIcon } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";

export const Sizes = () => (
  <Stage className="flex items-end gap-4">
    <NflIcon />
    <NflIcon className="size-6" />
    <NflIcon className="size-8" />
    <NflIcon className="size-12" />
  </Stage>
);

export const InheritsColor = () => (
  <Stage className="flex items-center gap-4">
    <NflIcon className="size-8 text-foreground" />
    <NflIcon className="size-8 text-muted-foreground" />
    <NflIcon className="size-8 text-primary" />
  </Stage>
);

export const WithLabel = () => (
  <Stage>
    <span className="inline-flex items-center gap-2 text-sm font-medium"><NflIcon />Scoreboard</span>
  </Stage>
);
