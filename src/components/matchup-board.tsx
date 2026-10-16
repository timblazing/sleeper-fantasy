"use client";

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MatchupHero } from "@/components/matchup-hero";
import { MatchupLineup } from "@/components/matchup-lineup";
import type { MatchupDetail } from "@/lib/types";

/** Centered dialog on larger screens; below `sm` it docks to the bottom as a sheet. */
function MatchupDialog({ matchup, week, leagueId, username }: { matchup: MatchupDetail; week: number; leagueId?: string; username?: string }) {
  return (
    <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-h-[88dvh] max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:data-open:zoom-in-100 max-sm:data-open:slide-in-from-bottom max-sm:data-closed:zoom-out-100 max-sm:data-closed:slide-out-to-bottom">
      <DialogTitle className="sr-only">Week {week} matchup</DialogTitle>
      <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30 sm:hidden" />
      <div className="min-h-0 overflow-y-auto px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-12 sm:pb-6">
        <MatchupHero leagueId={leagueId} matchup={matchup} username={username} />
        <div className="mt-4 mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Starters</p>
          <p className="text-xs text-muted-foreground">Live points · projected below</p>
        </div>
        <MatchupLineup dimTrailing leagueId={leagueId} matchup={matchup} username={username} />
      </div>
    </DialogContent>
  );
}

function MatchupCard({ matchup, week, leagueId, username }: { matchup: MatchupDetail; week: number; leagueId?: string; username?: string }) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label={`${matchup.home.team.name} versus ${matchup.away.team.name}`}
        className="group block w-full rounded-xl text-left text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MatchupHero className="rounded-xl bg-card transition-shadow group-hover:ring-foreground/20" matchup={matchup} />
      </DialogTrigger>
      <MatchupDialog leagueId={leagueId} matchup={matchup} username={username} week={week} />
    </Dialog>
  );
}

export function MatchupBoard({ matchups, week, leagueId, username }: { matchups: MatchupDetail[]; week: number; leagueId?: string; username?: string }) {
  return <div className="grid gap-4 xl:grid-cols-2">{matchups.map((matchup) => <MatchupCard key={matchup.id} leagueId={leagueId} matchup={matchup} username={username} week={week} />)}</div>;
}
