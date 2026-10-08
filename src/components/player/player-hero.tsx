import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PositionBadge } from "@/components/position-badge";
import { buttonVariants } from "@/components/ui/button";
import { initials, playerImageUrl } from "@/lib/display";
import type { PlayerProfile } from "@/lib/roster-audit";
import { cn, withUsername } from "@/lib/utils";

export function PlayerHero({ profile, leagueId, username }: { profile: PlayerProfile; leagueId: string; username?: string }) {
  const { player } = profile;
  const bio = [
    { label: "Age", value: player.age?.toFixed(1) },
    { label: "Height", value: player.heightInches ? `${Math.floor(player.heightInches / 12)}′${player.heightInches % 12}″` : null },
    { label: "Weight", value: player.weightLbs ? `${player.weightLbs} lb` : null },
    { label: "Exp", value: player.yearsExp === 0 ? "Rookie" : player.yearsExp != null ? `${player.yearsExp} yr` : null },
  ];
  return (
    <header className="px-5 pb-5 pt-6 md:px-7 md:pt-8">
      <div className="flex items-center gap-4 pr-6">
        <Avatar className="size-16 shrink-0 bg-muted md:size-20">
          <AvatarImage alt="" src={playerImageUrl({ id: player.sleeperId, position: player.position, team: player.team })} />
          <AvatarFallback>{initials(player.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{player.name}</h1>
          <div className="mt-2 flex items-center gap-2"><PositionBadge position={player.position} /><span className="text-sm text-muted-foreground">{player.team ?? "Free agent"}</span></div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <dl className="grid flex-1 grid-cols-4 gap-3">
          {bio.map(({ label, value }) => <div key={label}><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="mt-0.5 text-sm font-medium tabular-nums">{value ?? "—"}</dd></div>)}
        </dl>
        <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")} href={withUsername(`/${leagueId}/trade`, username)}>Trade <ArrowUpRight className="size-3.5" /></Link>
      </div>
    </header>
  );
}
