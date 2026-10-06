import type { ReactNode } from "react";
import { CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Actions stack below the title on phones rather than squeezing the description. */
export function PanelHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <CardHeader className="flex flex-col gap-2 sm:grid">
      <CardTitle>{title}</CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : null}
      {actions ? <CardAction className="flex max-w-full flex-wrap items-center gap-2 self-start sm:justify-self-end">{actions}</CardAction> : null}
    </CardHeader>
  );
}
