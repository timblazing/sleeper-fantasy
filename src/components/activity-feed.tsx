import Link from "next/link";
import { ArrowLeftRightIcon } from "lucide-react";
import { ActivityRow } from "@/components/recent-activity-card";
import { PanelHeader } from "@/components/panel-header";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { ActivityItem } from "@/lib/types";
import { withUsername } from "@/lib/utils";

export const ACTIVITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "trade", label: "Trades" },
  { value: "add", label: "Adds" },
  { value: "drop", label: "Drops" },
] as const;
export type ActivityFilter = (typeof ACTIVITY_FILTERS)[number]["value"];

/** Total: anything unrecognised means "all". */
export const parseActivityFilter = (value: string | string[] | undefined): ActivityFilter => {
  const raw = Array.isArray(value) ? value[0] : value;
  return ACTIVITY_FILTERS.find((filter) => filter.value === raw)?.value ?? "all";
};

/** The full transaction feed with URL-backed type filters. */
export function ActivityFeed({ items, filter, leagueId, username }: { items: ActivityItem[]; filter: ActivityFilter; leagueId: string; username?: string }) {
  const count = (value: ActivityFilter) => (value === "all" ? items.length : items.filter((item) => item.kind === value).length);
  const visible = filter === "all" ? items : items.filter((item) => item.kind === filter);
  const hrefFor = (value: ActivityFilter) => withUsername(`/${leagueId}/activity${value === "all" ? "" : `?type=${value}`}`, username);

  return (
    <div className="flex flex-col gap-5">
      <div className="min-w-0 overflow-x-auto pb-1">
        <ButtonGroup aria-label="Transaction type">
          {ACTIVITY_FILTERS.map(({ value, label }) => (
            <Button key={value} nativeButton={false} size="sm" variant={filter === value ? "default" : "outline"} aria-current={filter === value ? "page" : undefined} render={<Link href={hrefFor(value)} />}>
              {label}<span className="ml-1.5 tabular-nums opacity-70">{count(value)}</span>
            </Button>
          ))}
        </ButtonGroup>
      </div>
      <Card>
        <PanelHeader title={ACTIVITY_FILTERS.find((entry) => entry.value === filter)?.label ?? "All"} description={`${visible.length} ${visible.length === 1 ? "move" : "moves"}, newest first`} />
        <CardContent>
          {visible.length ? (
            <ul className="grid gap-x-10 lg:grid-cols-2 [&>li]:border-b [&>li]:py-3 [&>li]:first:pt-3 lg:[&>li:nth-last-child(-n+2)]:border-b-0">
              {visible.map((item) => <ActivityRow item={item} key={item.id} leagueId={leagueId} username={username} />)}
            </ul>
          ) : (
            <Empty className="min-h-56 border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><ArrowLeftRightIcon /></EmptyMedia>
                <EmptyTitle>{filter === "all" ? "No moves yet" : "Nothing in this view"}</EmptyTitle>
                <EmptyDescription>{filter === "all" ? "Trades and waiver claims will show up here once the league gets going." : "No transactions of this type have been recorded this season."}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
