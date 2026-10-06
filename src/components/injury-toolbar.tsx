import { InjurySearch } from "@/components/injury-search";
import { FilterToolbar } from "@/components/filter-toolbar";
import { clearedInjuryQuery, hasActiveInjuryFilters, injuriesHref, INJURY_POSITIONS, type InjuryQuery } from "@/lib/injury-query";

const positionLabel = (position: string) => (position === "all" ? "All" : position);

/** The same shape as the Players toolbar (src/components/rankings-toolbar.tsx): the segmented
 *  position filter on the left and search on the right. Every control is a `Link`, so the whole
 *  view is in the URL and nothing here needs client state. */
export function InjuryToolbar({ leagueId, query }: { leagueId: string; query: InjuryQuery }) {
  return (
    <FilterToolbar
      options={INJURY_POSITIONS.map((position) => ({ value: position, label: positionLabel(position), href: injuriesHref(leagueId, query, { position }) }))}
      value={query.position}
      search={<InjurySearch leagueId={leagueId} query={query} />}
      resetHref={hasActiveInjuryFilters(query) ? injuriesHref(leagueId, clearedInjuryQuery(query)) : undefined}
    />
  );
}
