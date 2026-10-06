import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { RankingsSearch } from "@/components/rankings-search";
import { FilterToolbar } from "@/components/filter-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { describeAgeRange, rankingsHref, rankingsPositionsFor, type RankingsQuery } from "@/lib/rankings-query";
import type { ValueBasis } from "@/lib/value-basis";

const positionLabel = (position: string) => (position === "all" ? "All" : position === "picks" ? "Picks" : position === "rookies" ? "Rookies" : position);

/** Every control here is a navigation, not client state: PLAN.md line 64 requires the
 *  filters to be shareable URL state, so the resulting URL is always copy-pasteable.
 *
 *  One row, two clusters: position is the filter people reach for constantly so it stays
 *  segmented and always visible; search is typed rarely but needs its own box. An age range
 *  arriving in the URL still applies and shows as a removable badge below. */
export function RankingsToolbar({ basis, leagueId, query }: { basis: ValueBasis; leagueId: string; query: RankingsQuery }) {
  const ageLabel = describeAgeRange(query);
  const positions = rankingsPositionsFor(basis);
  return (
    <FilterToolbar
      options={positions.map((position) => ({ value: position, label: positionLabel(position), href: rankingsHref(leagueId, query, { position }) }))}
      value={query.position}
      search={<RankingsSearch leagueId={leagueId} query={query} />}
      resetHref={query.position !== "all" || query.search || ageLabel ? rankingsHref(leagueId, query, { position: "all", search: "", minAge: undefined, maxAge: undefined }) : undefined}
      activeFilters={ageLabel ? (
          <Badge className="gap-1 pr-1 font-normal" variant="secondary">
            Age {ageLabel}
            <Button aria-label="Clear age filter" className="size-4 rounded-sm" nativeButton={false} size="icon-xs" variant="ghost" render={<Link href={rankingsHref(leagueId, query, { minAge: undefined, maxAge: undefined })} />}>
              <X aria-hidden="true" />
            </Button>
          </Badge>
      ) : null}
    />
  );
}

const pageWindow = (page: number, totalPages: number) => {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  return Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index).filter((candidate) => candidate >= 1 && candidate <= totalPages);
};

/** Lives in the table's CardFooter — the count and the pager belong to the table, not to
 *  the page, and footer-inside-card keeps the reader's eye from leaving the data. */
export function RankingsPagination({ leagueId, query, page, totalPages, totalLabel }: { leagueId: string; query: RankingsQuery; page: number; totalPages: number; totalLabel: string }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{totalLabel}</p>
      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1.5">
          <Button disabled={page <= 1} nativeButton={false} size="sm" variant="outline" render={page <= 1 ? <span /> : <Link href={rankingsHref(leagueId, query, { page: page - 1 })} />}><ChevronLeft data-icon="inline-start" aria-hidden="true" />Prev</Button>
          {pageWindow(page, totalPages).map((candidate) => <Button key={candidate} nativeButton={false} size="sm" variant={candidate === page ? "default" : "ghost"} aria-current={candidate === page ? "page" : undefined} render={<Link href={rankingsHref(leagueId, query, { page: candidate })} />}>{candidate}</Button>)}
          <Button disabled={page >= totalPages} nativeButton={false} size="sm" variant="outline" render={page >= totalPages ? <span /> : <Link href={rankingsHref(leagueId, query, { page: page + 1 })} />}>Next<ChevronRight data-icon="inline-end" aria-hidden="true" /></Button>
        </nav>
      ) : null}
    </div>
  );
}
