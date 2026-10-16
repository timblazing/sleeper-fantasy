import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { PanelHeader, PanelLink } from "@/components/panel-header";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { TeamLink } from "@/components/team-link";
import { headshotUrl } from "@/lib/display";
import type { ActivityItem, NflPlayer } from "@/lib/types";
import { cn } from "@/lib/utils";

type MoveKind = "add" | "drop" | "trade";

/**
 * One marker per player, written out: a mono kicker above the name carries the verb and how it
 * happened, so the header row is just who and when.
 */
const KICKER = {
  add: { verb: "+ Add", tone: "text-positive" },
  drop: { verb: "− Drop", tone: "text-negative" },
  trade: { verb: "⇄ Traded", tone: "text-primary" },
} as const;

function PlayerMove({ kind, player, via }: { kind: MoveKind; player: NflPlayer; via?: string }) {
  const { verb, tone } = KICKER[kind];
  return (
    <div className="flex items-center gap-3">
      <Avatar shape={player.position === "DEF" ? "logo" : "circle"} className="size-11 shrink-0">
        <AvatarImage alt="" src={headshotUrl(player)} />
        <AvatarFallback className="text-xs">{player.position ?? "NFL"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 truncate font-mono text-[0.625rem] font-bold uppercase leading-4 tracking-widest">
          <span className={tone}>{verb}</span>
          {via ? <span className="font-medium tracking-wider text-muted-foreground"> · {via}</span> : null}
        </p>
        <p className="truncate text-[0.9375rem] font-medium leading-5">{player.name}</p>
        <p className="text-xs text-muted-foreground">{[player.position, player.team].filter(Boolean).join(" · ") || "NFL player"}</p>
      </div>
    </div>
  );
}

/** How an arrival happened: a claim (with its bid) or a free agent pickup. */
function arrivalVia(item: ActivityItem) {
  if (item.type === "Waiver claim") return item.bid !== null ? `Claim · $${item.bid}` : "Claim";
  return "Free agent";
}

export function ActivityRow({ item, leagueId, username }: { item: ActivityItem; leagueId?: string; username?: string }) {
  const trade = item.kind === "trade";
  // A trade's first side receives `adds` and sends `drops` to the other side.
  const [receiver, sender] = item.teams;
  const moves = [
    ...item.adds.map((player) => ({ kind: trade ? "trade" as const : "add" as const, player, via: trade ? receiver && `To ${receiver.name}` : arrivalVia(item) })),
    ...item.drops.map((player) => ({ kind: trade ? "trade" as const : "drop" as const, player, via: trade ? sender && `To ${sender.name}` : undefined })),
  ].slice(0, 3);

  return (
    <li className="border-b py-3.5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex min-w-0 items-baseline gap-x-2 text-xs">
        <span className="truncate font-semibold text-foreground">
          {item.teams.length && leagueId ? item.teams.map((team, index) => (
            <span key={team.rosterId}>
              {index ? <span className="px-1 font-normal text-muted-foreground">⇄</span> : null}
              <TeamLink leagueId={leagueId} rosterId={team.rosterId} username={username}>{team.name}</TeamLink>
            </span>
          )) : item.team ?? (trade ? "League trade" : "League")}
        </span>
        <span className="sr-only">{item.type}</span>
        <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">{item.time}</span>
      </div>
      <div className="mt-2.5">
        {moves.length ? (
          <div className="grid gap-3">{moves.map((move) => <PlayerMove key={`${move.kind}-${move.player.id}`} {...move} />)}</div>
        ) : (
          <p className="text-sm font-medium leading-snug" title={item.detail}>{item.detail}</p>
        )}
      </div>
    </li>
  );
}

/** The league's last handful of completed moves — trades, waiver claims, and free agent adds. */
export function RecentActivityCard({ activity, leagueId, username, href, limit = 8, fill = false, className }: {
  activity: ActivityItem[]; leagueId?: string; username?: string;
  /** Where the full feed lives; adds the panel's open-full-view link. */
  href?: string; limit?: number;
  /** At xl, size to the row instead of the list: the feed scrolls inside whatever height its neighbour sets. */
  fill?: boolean; className?: string;
}) {
  return (
    <Card className={className}>
      <PanelHeader title="Recent activity" description="Trades, waiver claims, and free agent adds" actions={href ? <PanelLink href={href} label="Open full activity feed" /> : undefined} />
      <CardContent className={cn(fill && "xl:relative xl:min-h-72 xl:flex-1")}>
        {activity.length ? (
          <ul tabIndex={fill ? 0 : undefined} aria-label={fill ? "Recent league moves" : undefined} className={cn("flex flex-col", fill && "xl:absolute xl:inset-x-(--card-spacing) xl:inset-y-0 xl:overflow-y-auto xl:pb-6 xl:mask-b-from-[calc(100%-2rem)] xl:focus-visible:outline-none")}>
            {activity.slice(0, limit).map((item) => (
              <ActivityRow item={item} key={item.id} leagueId={leagueId} username={username} />
            ))}
          </ul>
        ) : (
          <Empty className="border py-6">
            <EmptyHeader>
              <EmptyTitle className="text-sm">No moves yet</EmptyTitle>
              <EmptyDescription className="text-xs">Trades and waiver claims will show up here once the league gets going.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
