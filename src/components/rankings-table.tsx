import Link from "next/link";
import { SearchX, TrendingDown, TrendingUp } from "lucide-react";
import { PlayerIdentity } from "@/components/player-identity";
import { PositionBadge } from "@/components/position-badge";
import { RankingsPagination } from "@/components/rankings-toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RankingsRow, RankingsView } from "@/lib/rankings-data";
import { describeRankingsFilters, rankingsHref, type RankingsQuery } from "@/lib/rankings-query";
import { basisMeta } from "@/lib/value-basis";
import { withUsername } from "@/lib/utils";


function Trend({ value }: { value: number }) {
  if (!value) return null; // A zero trend is not a trend — render nothing rather than a 0.
  const Icon = value > 0 ? TrendingUp : TrendingDown;
  return <span className={`inline-flex items-center gap-1 tabular-nums text-xs ${value > 0 ? "text-positive" : "text-destructive"}`}><Icon aria-hidden="true" className="size-3" />{value > 0 ? "+" : ""}{value.toLocaleString()}</span>;
}

function RankingsRowCells({ row, leagueId, username, maxValue, showTrend }: { row: RankingsRow; leagueId: string; username?: string; maxValue: number; showTrend: boolean }) {
  const share = maxValue > 0 ? Math.max(2, Math.round((row.value / maxValue) * 100)) : 0;
  const mine = row.kind === "player" && row.owner?.isMine;

  return (
    <TableRow className={mine ? "border-l-2 border-l-primary bg-muted/40" : undefined}>
      <TableCell className="tabular-nums font-medium text-muted-foreground">{row.rank}</TableCell>
      <TableCell>
        {row.kind === "pick" ? (
          <div className="flex items-center gap-3"><Avatar><AvatarFallback>PK</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-medium">{row.label}</p><p className="text-xs text-muted-foreground">Draft pick</p></div></div>
        ) : (
          <PlayerIdentity name={row.name} photoUrl={row.photoUrl} href={withUsername(`/${leagueId}/players/${row.sleeperId}`, username)} metadata={<>{row.team ?? "FA"}{row.owner ? ` · ${row.owner.teamName}` : ""}</>} badges={mine ? <Badge className="max-sm:hidden" variant="secondary">Your team</Badge> : null} />
        )}
      </TableCell>
      <TableCell className="max-sm:hidden">
        {row.kind === "pick" ? <Badge size="position" variant="outline">Pick</Badge> : <PositionBadge label={row.position} position={row.position} />}
      </TableCell>
      <TableCell className="max-md:pr-4">
        <div className="flex min-w-20 flex-col gap-1 sm:min-w-28"><span className="tabular-nums font-medium">{row.value.toLocaleString()}</span><Progress className="w-full max-sm:hidden" value={share} /></div>
      </TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell max-lg:pr-4">{row.kind === "pick" ? "—" : row.age !== null ? row.age.toFixed(1) : "—"}</TableCell>
      {showTrend ? <TableCell className="hidden lg:table-cell">{row.kind === "pick" ? <span className="text-muted-foreground">—</span> : <Trend value={row.trend7d} />}</TableCell> : null}
    </TableRow>
  );
}

export function RankingsTable({ view, query }: { view: RankingsView; query: RankingsQuery }) {
  // The projection board publishes no day-over-day movement, so redraft drops the 7d column
  // rather than filling it with zeroes.
  const showTrend = basisMeta(view.basis).hasMarket;
  if (!view.rows.length) {
    const active = describeRankingsFilters(query);
    return (
      <Card><CardContent>
        <Empty className="min-h-72 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><SearchX /></EmptyMedia>
            <EmptyTitle>No players match these filters</EmptyTitle>
            <EmptyDescription>{active ? `Nothing matched ${active}.` : "Nothing matched the current view."} Clear the filters to see the full board.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={rankingsHref(view.leagueId, { position: "all", search: "", sort: "value", page: 1, username: query.username })}>Clear filters</Link>
          </EmptyContent>
        </Empty>
      </CardContent></Card>
    );
  }

  return (
    <Card accent className="gap-0 py-0">
      <CardContent className="px-0">
        <Table className="max-sm:table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><span className="sm:hidden">#</span><span className="max-sm:hidden">Rank</span></TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="max-sm:hidden">Position</TableHead>
              <TableHead className="w-24 max-md:pr-4">{basisMeta(view.basis).columnLabel}</TableHead>
              <TableHead className="hidden md:table-cell max-lg:pr-4">Age</TableHead>
              {showTrend ? <TableHead className="hidden lg:table-cell">7d</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.rows.map((row) => <RankingsRowCells key={row.key} leagueId={view.leagueId} maxValue={view.maxValue} row={row} showTrend={showTrend} username={query.username} />)}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <RankingsPagination leagueId={view.leagueId} page={view.page} query={query} totalLabel={view.totalLabel} totalPages={view.totalPages} />
      </CardFooter>
    </Card>
  );
}
