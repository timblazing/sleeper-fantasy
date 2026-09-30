import { ResponsiveDialog } from "sleeper-fantasy-dashboard";

const noop = () => {};
const rows = [
  { team: "BUF", q: [7, 10, 3, 7], total: 27 },
  { team: "MIA", q: [3, 7, 7, 3], total: 20 },
];

export const GameDetails = () => (
  <ResponsiveDialog open onOpenChange={noop} title="Buffalo Bills at Miami Dolphins" description="NFL game details · ESPN">
    <div className="space-y-4 pt-3">
      <div className="rounded-xl border bg-muted/20 p-4 text-center">
        <div className="text-xs text-muted-foreground">Final</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">BUF 27 – 20 MIA</div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-xs tabular-nums">
          <thead><tr className="border-b text-muted-foreground"><th className="px-3 py-2 font-medium">Team</th>{[1, 2, 3, 4].map((q) => <th key={q} className="px-3 py-2 font-medium">Q{q}</th>)}<th className="px-3 py-2 font-medium">T</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.team} className="border-b"><td className="px-3 py-2 font-medium">{r.team}</td>{r.q.map((v, i) => <td key={i} className="px-3 py-2">{v}</td>)}<td className="px-3 py-2 font-semibold">{r.total}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">Josh Allen: 24/33, 281 yds, 2 TD · 8 rush, 41 yds, TD</p>
    </div>
  </ResponsiveDialog>
);

export const ManagerDraftGrade = () => (
  <ResponsiveDialog open onOpenChange={noop} title="Fourth & Long" description="clayb · 2026 Rookie Draft · 4 picks">
    <ul className="divide-y pt-2 text-sm">
      {[["1.03", "Ashton Jeanty", "RB · LV", "A"], ["2.08", "Tetairoa McMillan", "WR · CAR", "B+"], ["3.02", "Colston Loveland", "TE · CHI", "B"], ["4.11", "Jaxson Dart", "QB · NYG", "C"]].map(([pick, name, pos, grade]) => (
        <li key={pick} className="flex items-center gap-3 py-2.5">
          <span className="w-10 font-mono text-xs text-muted-foreground">{pick}</span>
          <span className="font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">{pos}</span>
          <span className="ml-auto rounded-md border px-1.5 text-xs font-semibold">{grade}</span>
        </li>
      ))}
    </ul>
  </ResponsiveDialog>
);
