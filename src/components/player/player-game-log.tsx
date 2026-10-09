import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PlayerProfile } from "@/lib/roster-audit";

const COLUMNS = [
  { key: "cmp", label: "Cmp" }, { key: "att", label: "Pass att" },
  { key: "pass", label: "Pass yd" }, { key: "ptd", label: "Pass TD" },
  { key: "int", label: "INT" }, { key: "car", label: "Car" },
  { key: "rush", label: "Rush yd" }, { key: "rtd", label: "Rush TD" },
  { key: "tgt", label: "Tgt" }, { key: "rec", label: "Rec" },
  { key: "recy", label: "Rec yd" }, { key: "retd", label: "Rec TD" },
];

export function PlayerGameLog({ profile }: { profile: PlayerProfile }) {
  const weeks = [...profile.weekly].sort((a, b) => b.week - a.week);
  const columns = COLUMNS.filter(column => weeks.some(week => (week.stats[column.key] ?? 0) !== 0));
  return (
    <section className="py-5">
      <h2 className="mb-3 font-heading text-base font-semibold">{profile.season ?? "Season"} game log</h2>
      <p className="mb-3 text-xs text-muted-foreground">Scroll horizontally for all stats. Focus the table and use arrow keys.</p>
      <Table tabIndex={0} aria-label="Weekly player statistics">
        <TableHeader><TableRow>
          <TableHead className="sticky left-0 bg-background">Wk</TableHead><TableHead>Opp</TableHead>
          {["PPR", "Std", "Snap %", "Rank", ...columns.map(column => column.label)].map(label => <TableHead key={label} className="text-right">{label}</TableHead>)}
        </TableRow></TableHeader>
        <TableBody>{weeks.map(week => {
          const snap = profile.snapsWeekly.find(entry => entry.week === week.week)?.offensePct;
          const rank = profile.weeklyRanks.find(entry => entry.week === week.week)?.rank;
          return <TableRow key={week.week}>
            <TableCell className="sticky left-0 bg-background">{week.week}</TableCell><TableCell>{week.opponent ?? "—"}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{week.pointsPpr?.toFixed(1) ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">{week.points?.toFixed(1) ?? "—"}</TableCell>
            <TableCell className="text-right tabular-nums">{snap == null ? "—" : `${Math.round(snap * 100)}%`}</TableCell>
            <TableCell className="text-right tabular-nums">{rank == null ? "—" : `#${rank}`}</TableCell>
            {columns.map(column => <TableCell key={column.key} className="text-right tabular-nums">{week.stats[column.key]?.toLocaleString("en-US") ?? "—"}</TableCell>)}
          </TableRow>;
        })}</TableBody>
      </Table>
    </section>
  );
}
