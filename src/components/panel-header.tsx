import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * One header for every panel: compact title, muted description, and right-aligned actions.
 * Actions drop below the title on phones rather than squeezing it.
 */
export function PanelHeader({ title, description, actions, className }: {
  title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string;
}) {
  return (
    <CardHeader className={cn("flex flex-wrap items-start gap-x-3 gap-y-2", className)}>
      <div className="min-w-0 flex-1">
        <CardTitle className="text-[0.9375rem] font-semibold leading-5 tracking-tight">{title}</CardTitle>
        {description ? <CardDescription className="mt-0.5 text-xs leading-4">{description}</CardDescription> : null}
      </div>
      {actions ? <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </CardHeader>
  );
}

/** The panel's "open the full view" affordance, shared so every card links the same way. */
export function PanelLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} title={label} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <ArrowUpRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

/** Small section label inside a panel body. */
export function PanelLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("type-label text-muted-foreground", className)}>{children}</h3>;
}
