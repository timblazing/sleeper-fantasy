import { ArrowLeftRightIcon, MinusIcon, PlusIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { PanelHeader, PanelLink } from "@/components/panel-header";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { TeamLink } from "@/components/team-link";
import { headshotUrl } from "@/lib/display";
import type { ActivityItem, NflPlayer } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Three shapes only, so the column reads at a glance: a player came in, a player went out, or
 * two rosters swapped. Waiver claims and free agent adds share the plus — both are an arrival.
 */
const ENTRY_STYLE = {
  add: { icon: PlusIcon, chip: "bg-positive/10 text-positive" },
  drop: { icon: MinusIcon, chip: "bg-negative/10 text-negative" },
  trade: { icon: ArrowLeftRightIcon, chip: "bg-primary/10 text-primary" },
} as const;

function PlayerMove({ kind, player }: { kind: "add" | "drop"; player: NflPlayer }) {
  const Icon = kind === "add" ? PlusIcon : MinusIcon;
  return (
    <div className="flex items-center gap-2.5">
      <Avatar shape={player.position === "DEF" ? "logo" : "circle"} className="size-9 shrink-0">
        <AvatarImage alt="" src={headshotUrl(player)} />
        <AvatarFallback className="text-xs">{player.position ?? "NFL"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className={cn("flex items-center gap-1 text-xs font-medium", kind === "add" ? "text-positive" : "text-negative")}>
          <Icon className="size-3" aria-hidden="true" /><span className="sr-only">{kind}</span>
        </p>
        <p className="truncate text-sm font-medium">{player.name}</p>
        <p className="text-xs text-muted-foreground">{[player.position, player.team].filter(Boolean).join(" · ") || "NFL player"}</p>
      </div>
    </div>
  );
}

export function ActivityRow({ item, leagueId, username }: { item: ActivityItem; leagueId?: string; username?: string }) {
  const { icon: Icon, chip } = ENTRY_STYLE[item.kind] ?? ENTRY_STYLE.add;
  const moves = [
    ...item.adds.map((player) => ({ kind: "add" as const, player })),
    ...item.drops.map((player) => ({ kind: "drop" as const, player })),
  ].slice(0, 3);

  return (
    <li className="border-b py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex min-w-0 items-baseline gap-x-2 gap-y-0.5 text-xs">
        <span className="truncate font-medium text-foreground">
          {item.teams.length && leagueId ? item.teams.map((team, index) => (
            <span key={team.rosterId}>
              {index ? <span className="px-1 text-muted-foreground">↔</span> : null}
              <TeamLink leagueId={leagueId} rosterId={team.rosterId} username={username}>{team.name}</TeamLink>
            </span>
          )) : item.team ?? (item.kind === "trade" ? "League trade" : "League")}
        </span>
        <span className="shrink-0 text-muted-foreground">{item.type}</span>
        <span className="ml-auto shrink-0 text-muted-foreground">{item.time}</span>
      </div>
      <div className="mt-2 flex items-start gap-2.5">
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", chip)}>
          <Icon aria-hidden="true" className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          {moves.length ? (
            <div className="grid gap-2">{moves.map((move) => <PlayerMove key={`${move.kind}-${move.player.id}`} {...move} />)}</div>
          ) : (
            <p className="text-sm font-medium leading-snug" title={item.detail}>{item.detail}</p>
          )}
        </div>
        {item.bid !== null ? (
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground">Bid</p>
            <p className="tabular-nums text-sm font-medium">${item.bid}</p>
          </div>
        ) : null}
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
