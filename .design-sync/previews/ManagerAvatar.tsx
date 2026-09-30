import { ManagerAvatar } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";

// No avatar id: the initials fallback is what renders without Sleeper's CDN.
export const InitialsFallback = () => (
  <Stage className="flex items-center gap-3">
    <ManagerAvatar avatar={null as unknown as string} name="Fourth & Long" />
    <ManagerAvatar avatar={null as unknown as string} name="Turf Monsters" />
    <ManagerAvatar avatar={null as unknown as string} name="Bijan Mustard" />
    <ManagerAvatar avatar={null as unknown as string} name="Kyren Kingdom" />
  </Stage>
);

export const Sizes = () => (
  <Stage className="flex items-center gap-3">
    <ManagerAvatar avatar={null as unknown as string} name="Puka Shells" className="size-6" />
    <ManagerAvatar avatar={null as unknown as string} name="Puka Shells" />
    <ManagerAvatar avatar={null as unknown as string} name="Puka Shells" className="size-10" />
  </Stage>
);

export const WithTeamName = () => (
  <Stage className="flex flex-col gap-3">
    {[["The Waddle Waddle", "mikeyt"], ["CeeDeez Nuts", "jlo_ff"], ["London Calling", "tbone"]].map(([team, manager]) => (
      <div key={team} className="flex items-center gap-3">
        <ManagerAvatar avatar={null as unknown as string} name={team} />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{team}</span>
          <span className="text-xs text-muted-foreground">@{manager}</span>
        </div>
      </div>
    ))}
  </Stage>
);
