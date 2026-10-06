import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

export type FilterOption = { value: string; label: string; href: string };

/** Filters navigate using URL state; they are not tab panels. */
export function FilterToolbar({ options, value, search, activeFilters, resetHref, label = "Position" }: {
  options: FilterOption[]; value: string; search: ReactNode; activeFilters?: ReactNode;
  resetHref?: string; label?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="min-w-0 overflow-x-auto pb-1">
          <ButtonGroup aria-label={label}>
            {options.map((option) => (
              <Button key={option.value} nativeButton={false} size="sm" variant={value === option.value ? "default" : "outline"}
                aria-current={value === option.value ? "page" : undefined} render={<Link href={option.href} />}>
                {option.label}
              </Button>
            ))}
          </ButtonGroup>
        </div>
        <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:flex-1 sm:justify-end">
          {search}
          {resetHref ? <Button nativeButton={false} size="sm" variant="ghost" render={<Link href={resetHref} />}>Clear filters</Button> : null}
        </div>
      </div>
      {activeFilters ? <div className="flex flex-wrap items-center gap-2">{activeFilters}</div> : null}
    </div>
  );
}
