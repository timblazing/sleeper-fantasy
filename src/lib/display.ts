// Pure presentation helpers, safe to import from client components. Nothing here may
// import a module that performs I/O — that is what dragged the Redis SDK and the Sleeper
// fetch layer into the browser bundle when these lived beside their data modules.
import type { NflPlayer, PlayerGame } from "@/lib/types";

export function initials(name: string): string {
  return name.split(/\s|&/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

export function avatarUrl(id: string): string {
  return `https://sleepercdn.com/avatars/thumbs/${id}`;
}

export function playerImageUrl(player: Pick<NflPlayer, "id" | "position" | "team">): string {
  return player.position === "DEF" && player.team
    ? `https://sleepercdn.com/images/team_logos/nfl/${player.team.toLowerCase()}.png`
    : `https://sleepercdn.com/content/nfl/players/thumb/${player.id}.jpg`;
}

/** Backward-compatible name for the shared Sleeper player image URL. */
export const headshotUrl = playerImageUrl;

export function describeGame(game: PlayerGame | null): string {
  if (!game) return "";
  if (game.bye) return "BYE";
  const side = game.home ? "vs" : "@";
  return game.state === "pre" ? `${side} ${game.opponent}` : `${side} ${game.opponent} · ${game.detail}`;
}

export function formatValue(value: number): string {
  if (!value) return "—";
  return value >= 10000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString("en-US");
}

export function formatTrend(trend: number): string {
  return `${trend > 0 ? "+" : ""}${Math.round(trend).toLocaleString("en-US")}`;
}

/**
 * Kickoff label for a game that has not started, in the reader's own zone.
 *
 * ESPN's `shortDetail` is a fixed "9/14 - 8:15 PM EDT" in the league's zone, which is both stale
 * for anyone outside Eastern and noisy for a game later today. Formatting from the ISO kickoff
 * instead gives "8:15 PM" today, "Sun 8:15 PM" inside the week, and a date beyond it.
 */
export function formatKickoff(kickoff: string, now: Date = new Date(), timeZone?: string): string {
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone });
  // Compare calendar days in the display zone, not UTC: a Sunday-night kickoff is still "today"
  // for a reader in Los Angeles even though its UTC date has already rolled over.
  const day = (value: Date) => value.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone });
  if (day(date) === day(now)) return time;
  const days = Math.round((new Date(day(date)).getTime() - new Date(day(now)).getTime()) / 86_400_000);
  if (days > 0 && days < 7) return `${date.toLocaleDateString("en-US", { weekday: "short", timeZone })} ${time}`;
  return `${date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone })} ${time}`;
}
