"use client";

import { useEffect, useRef, useState } from "react";
import type { FieldState, ScoreboardTeam } from "@/lib/nfl-scoreboard";
import { cn } from "@/lib/utils";

// Field coordinates run -10 (back of the away end zone) to 110 (back of the home end zone).
const pct = (yard: number) => ((yard + 10) / 120) * 100;

/** Eases a yard value to its new spot so a 30-second poll reads as the ball moving. */
function useTweened(target: number | null) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const from = current.current;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration = from === null || target === null || reduce ? 0 : 700;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      const next =
        from === null || target === null
          ? target
          : from + (target - from) * (1 - (1 - t) ** 3);
      current.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

export function Football({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 10" aria-hidden className={cn("h-2 w-3.5", className)}>
      <ellipse cx="8" cy="5" rx="7.5" ry="4.5" fill="#9a5b34" />
      <path
        d="M5 5h6M6.5 3.8v2.4M8 3.8v2.4M9.5 3.8v2.4"
        stroke="#fff"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A hairline field for game cards: end zones, line to gain, and the ball facing its target. */
export function FieldTrack({
  field,
  teams,
}: {
  field: FieldState;
  teams: ScoreboardTeam[];
}) {
  const ball = pct(field.ball);
  const gain = field.firstDown === null ? null : pct(field.firstDown);
  return (
    <div aria-hidden className="relative h-1.5 rounded-full bg-muted">
      {teams.map((team, index) => (
        <span
          key={team.id}
          className={cn(
            "absolute inset-y-0 w-[8.333%] opacity-90",
            index === 0 ? "left-0 rounded-l-full" : "right-0 rounded-r-full",
          )}
          style={{ backgroundColor: team.color ?? "var(--border)" }}
        />
      ))}
      {gain !== null ? (
        <span
          className="absolute inset-y-0 bg-[#facc15]/70"
          style={{
            left: `${Math.min(ball, gain)}%`,
            width: `${Math.abs(gain - ball)}%`,
          }}
        />
      ) : null}
      <span
        className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center"
        style={{ left: `${ball}%` }}
      >
        <span
          className={cn(
            "size-0 border-y-[5px] border-y-transparent",
            field.direction === 1
              ? "border-l-[7px] border-l-foreground"
              : "border-r-[7px] border-r-foreground",
          )}
        />
      </span>
    </div>
  );
}

// Broadcast-view field: a shallow trapezoid so the strip reads as turf, not a progress bar.
const W = 760;
const INSET = 34;
const TOP = 92;
const BOTTOM = 158;
const DRIVE_DEPTH = 0.42;
function pt(yard: number, depth: number) {
  const t = (yard + 10) / 120;
  const bottom = t * W;
  const top = INSET + t * (W - 2 * INSET);
  return [bottom + (top - bottom) * depth, BOTTOM + (TOP - BOTTOM) * depth];
}
function quad(from: number, to: number) {
  return [pt(from, 0), pt(to, 0), pt(to, 1), pt(from, 1)]
    .map((p) => p.join(","))
    .join(" ");
}
function yardLine(yard: number) {
  const [x1, y1] = pt(yard, 0);
  const [x2, y2] = pt(yard, 1);
  return { x1, y1, x2, y2 };
}

export function FieldView({
  field,
  teams,
}: {
  field: FieldState;
  teams: ScoreboardTeam[];
}) {
  const ball = useTweened(field.ball) ?? field.ball;
  const gain = useTweened(field.firstDown);
  const driveStart = useTweened(field.driveStart);
  const offense = teams.find((team) => team.id === field.offense);
  const [ballX, ballY] = pt(ball, DRIVE_DEPTH);
  const pinY = 44;
  return (
    <svg
      viewBox={`0 0 ${W} 190`}
      role="img"
      aria-label={`${offense?.abbreviation ?? "Offense"} ball ${field.down ? `${field.down} ` : ""}at ${field.spot || "midfield"}, driving toward the ${field.direction === 1 ? teams[1].abbreviation : teams[0].abbreviation} end zone`}
      className="w-full overflow-visible"
    >
      {Array.from({ length: 10 }, (_, i) => (
        <polygon
          key={i}
          points={quad(i * 10, i * 10 + 10)}
          fill={i % 2 ? "#2b6338" : "#2f6b3d"}
        />
      ))}
      {teams.map((team, index) => {
        const [x, y] = pt(index === 0 ? -5 : 105, 0.5);
        return (
          <g key={team.id}>
            <polygon
              points={index === 0 ? quad(-10, 0) : quad(100, 110)}
              fill={team.color ?? "#3a3f45"}
            />
            <text
              x={x}
              y={y + 7}
              textAnchor="middle"
              fill="#fff"
              fontSize="22"
              fontWeight="700"
              letterSpacing="2"
              opacity="0.92"
            >
              {team.abbreviation}
            </text>
          </g>
        );
      })}
      {Array.from({ length: 21 }, (_, i) => i * 5).map((yard) => (
        <line
          key={yard}
          {...yardLine(yard)}
          stroke="#fff"
          strokeOpacity={yard % 100 === 0 ? 0.85 : yard % 10 === 0 ? 0.4 : 0.16}
          strokeWidth={yard % 100 === 0 ? 3 : 2}
        />
      ))}
      <polygon
        points={quad(-10, 110)}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.6"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((yard) => {
        const [x] = pt(yard, 0);
        return (
          <text
            key={yard}
            x={x}
            y={BOTTOM + 28}
            textAnchor="middle"
            fontSize="20"
            className="fill-muted-foreground font-mono"
          >
            {yard <= 50 ? yard : 100 - yard}
          </text>
        );
      })}

      <line {...yardLine(ball)} stroke="#7cb6ff" strokeWidth="4" />
      {gain !== null ? (
        <line {...yardLine(gain)} stroke="#facc15" strokeWidth="4" />
      ) : null}
      {driveStart !== null && Math.abs(driveStart - ball) > 0.5 ? (
        <>
          <line
            x1={pt(driveStart, DRIVE_DEPTH)[0]}
            y1={pt(driveStart, DRIVE_DEPTH)[1]}
            x2={ballX}
            y2={ballY}
            stroke="#fff"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle
            cx={pt(driveStart, DRIVE_DEPTH)[0]}
            cy={pt(driveStart, DRIVE_DEPTH)[1]}
            r="6"
            fill="#2f6b3d"
            stroke="#fff"
            strokeWidth="3"
          />
        </>
      ) : null}

      <line
        x1={ballX}
        y1={pinY + 30}
        x2={ballX}
        y2={ballY - 8}
        stroke={offense?.color ?? "#fff"}
        strokeWidth="2.5"
      />
      <circle
        cx={ballX}
        cy={pinY}
        r="30"
        className="fill-card"
        stroke={offense?.color ?? "#fff"}
        strokeWidth="3"
      />
      {offense?.logo ? (
        <image
          href={offense.logo}
          x={ballX - 21}
          y={pinY - 21}
          width="42"
          height="42"
        />
      ) : (
        <text
          x={ballX}
          y={pinY + 6}
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          className="fill-foreground"
        >
          {offense?.abbreviation}
        </text>
      )}
      <g transform={`translate(${ballX} ${ballY})`}>
        <ellipse
          rx="11"
          ry="6.5"
          fill="#9a5b34"
          stroke="#fff"
          strokeWidth="2"
        />
        <path
          d={
            field.direction === 1
              ? "M15 -5 L23 0 L15 5"
              : "M-15 -5 L-23 0 L-15 5"
          }
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
