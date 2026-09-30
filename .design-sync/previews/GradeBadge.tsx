import { GradeBadge } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";

export const GradeScale = () => (
  <Stage className="flex flex-wrap items-center gap-2">
    {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"].map((grade) => <GradeBadge key={grade} grade={grade} />)}
  </Stage>
);

export const ToneBands = () => (
  <Stage className="flex flex-col gap-3">
    {[
      ["A", "Fourth & Long — elite value haul"],
      ["B+", "Turf Monsters — solid, few reaches"],
      ["C", "Bijan Mustard — market-neutral draft"],
      ["D+", "Tank Commander — reached on RB3s"],
    ].map(([grade, label]) => (
      <div key={grade} className="flex items-center gap-3 text-sm">
        <GradeBadge grade={grade} />
        <span className="text-muted-foreground">{label}</span>
      </div>
    ))}
  </Stage>
);
