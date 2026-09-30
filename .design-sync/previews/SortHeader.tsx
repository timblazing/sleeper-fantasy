import { useState } from "react";
import { SortHeader } from "sleeper-fantasy-dashboard";
import { Stage } from "./_fixtures/stage";

type Key = "grade" | "surplus" | "picks";
const noop = () => {};

const HeaderRow = ({ active, direction }: { active: Key | null; direction: "asc" | "desc" }) => (
  <table className="w-full text-sm" style={{ maxWidth: 520 }}>
    <thead>
      <tr className="border-b text-xs text-muted-foreground">
        <th className="px-2 py-2 text-left font-medium">Team</th>
        <th className="px-2 py-2 font-medium"><SortHeader active={active === "grade"} direction={direction} onClick={noop}>Grade</SortHeader></th>
        <th className="px-2 py-2 font-medium"><SortHeader active={active === "surplus"} direction={direction} onClick={noop}>Surplus</SortHeader></th>
        <th className="px-2 py-2 font-medium"><SortHeader active={active === "picks"} direction={direction} onClick={noop}>Picks</SortHeader></th>
      </tr>
    </thead>
    <tbody>
      {[["Fourth & Long", "A", "+2,884", 12], ["Turf Monsters", "B+", "+1,540", 11], ["Tank Commander", "D+", "-1,682", 13]].map(([team, grade, surplus, picks]) => (
        <tr key={team as string} className="border-b">
          <td className="px-2 py-2">{team}</td>
          <td className="px-2 py-2 text-right">{grade}</td>
          <td className="px-2 py-2 text-right tabular-nums">{surplus}</td>
          <td className="px-2 py-2 text-right tabular-nums">{picks}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const SortedDescending = () => <Stage><HeaderRow active="surplus" direction="desc" /></Stage>;

export const SortedAscending = () => <Stage><HeaderRow active="grade" direction="asc" /></Stage>;

export const LeftAligned = () => (
  <Stage>
    <table className="text-sm" style={{ width: 240 }}>
      <thead>
        <tr className="border-b text-xs text-muted-foreground">
          <th className="px-2 py-2 text-left font-medium"><SortHeader active direction="desc" align="left" onClick={noop}>Manager</SortHeader></th>
        </tr>
      </thead>
    </table>
  </Stage>
);

export const Interactive = () => {
  const [sort, setSort] = useState<{ key: Key; direction: "asc" | "desc" }>({ key: "picks", direction: "desc" });
  const click = (key: Key) => () => setSort((s) => ({ key, direction: s.key === key && s.direction === "desc" ? "asc" : "desc" }));
  const labels: Record<Key, string> = { grade: "Grade", surplus: "Surplus", picks: "Picks" };
  return (
    <Stage>
      <table className="w-full text-sm" style={{ maxWidth: 520 }}>
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="px-2 py-2 text-left font-medium">Team</th>
            {(["grade", "surplus", "picks"] as Key[]).map((k) => (
              <th key={k} className="px-2 py-2 font-medium"><SortHeader active={sort.key === k} direction={sort.direction} onClick={click(k)}>{labels[k]}</SortHeader></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[["Tank Commander", "D+", "-1,682", 13], ["Fourth & Long", "A", "+2,884", 12], ["Turf Monsters", "B+", "+1,540", 11]].map(([team, grade, surplus, picks]) => (
            <tr key={team as string} className="border-b">
              <td className="px-2 py-2">{team}</td>
              <td className="px-2 py-2 text-right">{grade}</td>
              <td className="px-2 py-2 text-right tabular-nums">{surplus}</td>
              <td className="px-2 py-2 text-right tabular-nums">{picks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Stage>
  );
};
