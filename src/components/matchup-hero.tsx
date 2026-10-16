import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TeamWash } from "@/components/team-wash";
import type { MatchupDetail, MatchupSide } from "@/lib/types";
import { cn, withUsername } from "@/lib/utils";

const started = (side: MatchupSide) => side.slots.some((entry) => entry.game?.state === "in" || entry.game?.state === "post");
const projected = (value: number | null) => value == null ? "—" : value.toFixed(1);
// Favored reads positive and the underdog negative, matching the summary rows elsewhere. An exact 50
// (or no estimate) stays neutral rather than picking a side.
const tone = (probability: number | null) =>
  probability == null || probability === 50 ? "text-muted-foreground" : probability > 50 ? "text-positive" : "text-negative";
const fill = (probability: number) => probability === 50 ? "bg-muted-foreground/50" : probability > 50 ? "bg-positive" : "bg-negative";

/** True while any starter in the matchup is mid-game. */
export function matchupIsLive(matchup: MatchupDetail) {
  return [...matchup.home.slots, ...matchup.away.slots].some((entry) => entry.game?.state === "in");
}

export function LiveBadge() {
  return (
    <Badge className="border-success/25" variant="success">
      <span aria-hidden className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-success" />
      </span>
      Live
    </Badge>
  );
}

function Team({ side, reverse, leagueId, username }: { side: MatchupSide; reverse?: boolean; leagueId?: string; username?: string }) {
  const name = "line-clamp-2 text-sm font-semibold leading-tight [overflow-wrap:break-word] [text-wrap:balance] @lg:text-base";
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", reverse && "@lg:flex-row-reverse @lg:text-right")}>
      <Avatar className="size-8 bg-muted @lg:size-9 @2xl:size-11">
        {side.team.avatar ? <AvatarImage alt="" src={`https://sleepercdn.com/avatars/thumbs/${side.team.avatar}`} /> : null}
        <AvatarFallback>{side.team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">@{side.team.manager}</p>
        {leagueId ? (
          <Link className={cn(name, "hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")} href={withUsername(`/${leagueId}/teams/${side.team.rosterId}`, username)}>
            {side.team.name}
          </Link>
        ) : (
          <p className={name}>{side.team.name}</p>
        )}
      </div>
    </div>
  );
}

function Score({ side, trailing, className }: { side: MatchupSide; trailing: boolean; className?: string }) {
  return (
    <div className={cn("text-right tabular-nums @lg:text-center", className)}>
      <p className={cn("text-[1.75rem] font-bold leading-none tracking-tight @lg:text-[1.625rem] @2xl:text-[2.25rem]", (trailing || !started(side)) && "text-muted-foreground")}>
        {started(side) ? side.score.toFixed(1) : "-"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground"><span className="sr-only">Projected </span>{projected(side.projectedScore)}<span className="sr-only"> points</span></p>
    </div>
  );
}

function WinProbability({ home, away }: { home: number; away: number }) {
  return (
    <div className="mt-3.5 grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2.5 text-xs font-semibold tabular-nums">
      <span className={tone(home)}><span className="sr-only">Win probability </span>{home}%</span>
      <div aria-hidden className="relative h-1.5 rounded-full after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-foreground/35">
        <div className={cn("absolute inset-0 rounded-full opacity-65", fill(away))} />
        <div className={cn("relative h-full rounded-full", fill(home))} style={{ width: `${home}%` }} />
      </div>
      <span className={cn("text-right", tone(away))}>{away}%</span>
    </div>
  );
}

/**
 * The dashboard's featured scoreboard: big scores and a tug-of-war win
 * probability bar. Teams sit side by side once the card is wide enough and stack into rows below
 * that, so long team names wrap to two lines instead of truncating. Without `leagueId` the team names
 * render as plain text, for callers that wrap the whole hero in their own button. Each side is tinted
 * with its avatar's color; `bare` drops the hero's own surface and tint so a caller can bleed both
 * across a larger header (place a `TeamWash` behind it).
 */
export function MatchupHero({ matchup, leagueId, username, className, bare = false }: { matchup: MatchupDetail; leagueId?: string; username?: string; className?: string; bare?: boolean }) {
  const { home, away } = matchup;
  const inPlay = started(home) || started(away);
  const homeLeads = inPlay && home.score > away.score;
  const awayLeads = inPlay && away.score > home.score;
  const homeProbability = matchup.homeWinProbability;
  const awayProbability = matchup.awayWinProbability;

  return (
    <div className={cn("@container relative", !bare && "overflow-hidden rounded-lg bg-background/60 p-3 ring-1 ring-border sm:p-4", className)}>
      {bare ? null : <TeamWash away={away.team.avatar} home={home.team.avatar} />}
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 [grid-template-areas:'home_homeScore''away_awayScore'] @lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] @lg:gap-x-3 @2xl:gap-x-3.5 @lg:[grid-template-areas:'home_homeScore_vs_awayScore_away']">
        <div className="[grid-area:home]"><Team leagueId={leagueId} side={home} username={username} /></div>
        <Score className="[grid-area:homeScore]" side={home} trailing={awayLeads} />
        <span aria-hidden className="hidden -translate-y-2 rounded-md border border-border-strong px-1.5 py-0.5 text-[0.625rem] font-bold text-muted-foreground [grid-area:vs] @lg:block">VS</span>
        <Score className="[grid-area:awayScore]" side={away} trailing={homeLeads} />
        <div className="[grid-area:away]"><Team leagueId={leagueId} reverse side={away} username={username} /></div>
      </div>
      {homeProbability != null && awayProbability != null ? <div className="relative"><WinProbability away={awayProbability} home={homeProbability} /></div> : null}
    </div>
  );
}
