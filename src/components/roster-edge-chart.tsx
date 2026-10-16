"use client";

import { useState, type CSSProperties } from "react";
import { PositionBadge } from "@/components/position-badge";
import { formatValue } from "@/lib/display";
import type { PositionRoom } from "@/lib/league-values";
import type { PositionScarcity } from "@/lib/team-insights";
import { cn } from "@/lib/utils";

const DOT: Record<string, string> = {
  QB: "bg-position-qb-foreground shadow-[0_0_14px_var(--position-qb-foreground)]",
  RB: "bg-position-rb-foreground shadow-[0_0_14px_var(--position-rb-foreground)]",
  WR: "bg-position-wr-foreground shadow-[0_0_14px_var(--position-wr-foreground)]",
  TE: "bg-position-te-foreground shadow-[0_0_14px_var(--position-te-foreground)]",
};
const SPAN: Record<string, string> = {
  QB: "bg-position-qb-foreground", RB: "bg-position-rb-foreground", WR: "bg-position-wr-foreground", TE: "bg-position-te-foreground",
};
const STEP = 20;

type Team = { rosterId: number; name: string; value: number; rank: number; relative: number; isUser: boolean };
type Row = { position: string; rank: number; relative: number | null; teams: Team[] };
type Hover = { position: string; rosterId: number };

const ordinal = (n: number) => {
  const suffix = ["th", "st", "nd", "rd"], v = n % 100;
  return `${n}${suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0]}`;
};
const signed = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(0)}%`;

function buildRows(rooms: PositionRoom[], scarcity: PositionScarcity[]): Row[] {
  return rooms.map((room) => {
    const avg = room.leagueAvg;
    const relative = avg > 0 ? (room.value / avg - 1) * 100 : null;
    const rows = scarcity.find((entry) => entry.position === room.position)?.rows ?? [];
    const teams = avg > 0 ? rows.map((row, index) => ({
      rosterId: row.rosterId, name: row.name, value: row.value, rank: index + 1, relative: (row.value / avg - 1) * 100, isUser: row.isUser,
    })) : [];
    return { position: room.position, rank: room.rank, relative, teams };
  });
}

/** Shared "% vs league average" axis in 20-point steps, wide enough for every team but capped so one outlier cannot flatten the rest. */
function buildDomain(rows: Row[]) {
  const values = rows.flatMap((row) => row.teams.map((team) => team.relative));
  const lo = Math.max(-100, Math.min(-STEP, Math.floor(Math.min(0, ...values) / STEP) * STEP));
  const hi = Math.min(100, Math.max(STEP, Math.ceil(Math.max(0, ...values) / STEP) * STEP));
  const ticks: number[] = [];
  for (let tick = lo; tick <= hi; tick += STEP) ticks.push(tick);
  return { lo, hi, ticks };
}

/**
 * Every team in the league on one "% vs average" line per position, with the user's room glowing.
 * Rank alone hides the gaps; this shows whether 5th is a tight pack or a long way off 1st.
 */
export function RosterEdgeChart({ rooms, scarcity, teams, isDynasty }: { rooms: PositionRoom[]; scarcity: PositionScarcity[]; teams: number; isDynasty: boolean }) {
  const [hover, setHover] = useState<Hover | null>(null);
  const rows = buildRows(rooms, scarcity);
  const { lo, hi, ticks } = buildDomain(rows);
  const x = (relative: number) => ((Math.max(lo, Math.min(hi, relative)) - lo) / (hi - lo)) * 100;
  const zero = x(0);
  const labelEvery = ticks.length > 6 ? 2 : 1;
  const formatRoom = (value: number) => (isDynasty ? `${formatValue(Math.round(value))} value` : `${value.toFixed(1)} PPG`);

  return (
    <div className="grid flex-1 grid-cols-[2.75rem_minmax(0,1fr)_3.75rem] gap-x-3" style={{ gridTemplateRows: `auto repeat(${rows.length}, minmax(3.25rem, 1fr))` }}>
      {/* Gridlines span every row, so they sit in their own layer behind the tracks. */}
      <div aria-hidden="true" className="pointer-events-none relative col-start-2 row-span-full row-start-1">
        {ticks.map((tick) => <div key={tick} className={cn("absolute bottom-0 top-5 w-px", tick === 0 ? "bg-border-strong" : "border-l border-dashed border-border/70")} style={{ left: `${x(tick)}%` }} />)}
      </div>
      <div aria-hidden="true" className="relative col-start-2 row-start-1 h-5">
        {ticks.map((tick, index) => (tick === 0 || index % labelEvery === 0) ? (
          <span key={tick} className="absolute top-0 -translate-x-1/2 font-mono text-[0.625rem] tabular-nums text-muted-foreground/70" style={{ left: `${x(tick)}%` }}>{tick === 0 ? "avg" : `${tick > 0 ? "+" : ""}${tick}%`}</span>
        ) : null)}
      </div>

      {rows.map((row, index) => {
        const user = row.teams.find((team) => team.isUser);
        const hovered = hover?.position === row.position ? row.teams.find((team) => team.rosterId === hover.rosterId) : undefined;
        const delay = `${120 + index * 90}ms`;
        const enter = (team: Team) => () => setHover({ position: row.position, rosterId: team.rosterId });
        return (
          <div key={row.position} className="col-span-3 col-start-1 grid grid-cols-subgrid items-center" style={{ gridRowStart: index + 2 }}>
            <PositionBadge position={row.position} />
            <div className="relative h-8" aria-hidden="true" onPointerLeave={() => setHover(null)}>
              <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-muted" />
              {user ? <div
                className={cn("absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full opacity-80 animate-[roster-edge-span_900ms_cubic-bezier(0.2,1,0.4,1)_both]", SPAN[row.position] ?? "bg-info", user.relative >= 0 ? "origin-left" : "origin-right")}
                style={{ left: `${Math.min(zero, x(user.relative))}%`, width: `${Math.abs(x(user.relative) - zero)}%`, animationDelay: delay }}
              /> : null}
              {row.teams.filter((team) => !team.isUser).map((team) => <span
                key={team.rosterId}
                onPointerEnter={enter(team)}
                className={cn("absolute top-1/2 size-2 rounded-full bg-muted-foreground/45 ring-[1.5px] ring-card transition-[background-color,scale] [transform:translate(-50%,-50%)] before:absolute before:-inset-1.5 animate-[roster-edge-dot_1s_cubic-bezier(0.2,1.25,0.4,1)_both]", hovered?.rosterId === team.rosterId && "scale-150 bg-foreground/80")}
                style={{ left: `${x(team.relative)}%`, "--edge-from": `${zero}%`, animationDelay: delay } as CSSProperties}
              />)}
              {user ? <span
                onPointerEnter={enter(user)}
                className={cn("absolute top-1/2 z-10 size-3.5 rounded-full ring-[3px] ring-card [transform:translate(-50%,-50%)] before:absolute before:-inset-1.5 animate-[roster-edge-dot_1s_cubic-bezier(0.2,1.25,0.4,1)_both]", DOT[row.position] ?? "bg-info")}
                style={{ left: `${x(user.relative)}%`, "--edge-from": `${zero}%`, animationDelay: delay } as CSSProperties}
              /> : null}
              {hovered ? <div className="pointer-events-none absolute bottom-full z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md" style={{ left: `${Math.max(12, Math.min(88, x(hovered.relative)))}%` }}>
                <p className="font-medium">{hovered.isUser ? "Your room" : hovered.name}</p>
                <p className="tabular-nums text-muted-foreground">{ordinal(hovered.rank)} · {formatRoom(hovered.value)} · <span className={hovered.relative >= 0 ? "text-positive" : "text-negative"}>{signed(hovered.relative)}</span></p>
              </div> : null}
            </div>
            <div className="text-right tabular-nums">
              {row.relative == null ? <p className="text-xs text-muted-foreground">No baseline</p> : <>
                <p className={cn("font-heading text-base font-semibold leading-5 tracking-tight", row.relative >= 0 ? "text-positive" : "text-negative")}>{signed(row.relative)}</p>
                <p className="text-[0.6875rem] text-muted-foreground">{ordinal(row.rank)} of {teams}</p>
              </>}
              <span className="sr-only">{row.position}: {ordinal(row.rank)} of {teams}{row.relative == null ? "" : `, ${signed(row.relative)} vs league average`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
