import Link from "next/link";
import type { ReactNode } from "react";
import { PositionBadge } from "@/components/position-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, playerImageUrl } from "@/lib/display";
import { cn } from "@/lib/utils";

export function PlayerIdentity({ name, photoUrl, sleeperId, team, imagePosition, href, position, metadata, badges, children, size = "default", className }: {
  name: string; photoUrl?: string | null; sleeperId?: string; team?: string | null; imagePosition?: string | null; href?: string; position?: string | null;
  metadata?: ReactNode; badges?: ReactNode; children?: ReactNode; size?: "default" | "hero"; className?: string;
}) {
  const imageUrl = sleeperId ? playerImageUrl({ id: sleeperId, position: imagePosition ?? position ?? null, team: team ?? null }) : photoUrl;
  const nameClass = size === "hero" ? "type-heading break-words" : "block max-w-full truncate text-sm font-medium";
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Avatar className={cn("shrink-0 bg-muted", size === "hero" && "size-16")}>
        {imageUrl ? <AvatarImage alt="" src={imageUrl} /> : null}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {href ? <Link className={cn(nameClass, "min-w-0 max-w-full hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")} href={href}>{name}</Link>
            : size === "hero" ? <h1 className={nameClass}>{name}</h1> : <p className={nameClass}>{name}</p>}
          {position ? <PositionBadge position={position} /> : null}
          {badges}
        </div>
        {metadata ? <p className="type-caption mt-0.5 break-words text-muted-foreground">{metadata}</p> : null}
        {children}
      </div>
    </div>
  );
}
