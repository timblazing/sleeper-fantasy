import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PanelHeader } from "@/components/panel-header";
import { TeamLink } from "@/components/team-link";
import type { BracketGame, BracketSeat, PlayoffBracket } from "@/lib/playoff-bracket";
import { cn } from "@/lib/utils";

const initials = (name: string) => name.split(/\s|&/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

function Seat({ seat, leagueId, username }: { seat: BracketSeat; leagueId: string; username?: string }) {
  const pending = seat.rosterId === null;
  return (
    <div className={cn("flex items-center gap-2 px-2.5 py-2", seat.won === false && "opacity-50", seat.won && "bg-positive/[0.07]")}>
      <span className="w-4 shrink-0 text-center text-xs tabular-nums text-muted-foreground">{seat.seed ?? ""}</span>
      <Avatar className="size-6 shrink-0">
        {seat.avatar ? <AvatarImage alt="" src={`https://sleepercdn.com/avatars/thumbs/${seat.avatar}`} /> : null}
        <AvatarFallback className="text-[0.625rem]">{pending ? "?" : initials(seat.name)}</AvatarFallback>
      </Avatar>
      {pending ? (
        <span className="truncate text-xs text-muted-foreground">{seat.from ?? "TBD"}</span>
      ) : (
        <TeamLink className={cn("truncate text-xs font-medium", seat.won && "text-foreground")} leagueId={leagueId} rosterId={seat.rosterId} username={username}>{seat.name}</TeamLink>
      )}
    </div>
  );
}

function Game({ game, leagueId, username }: { game: BracketGame; leagueId: string; username?: string }) {
  return (
    <div className="overflow-hidden rounded-lg bg-background/50 ring-1 ring-border">
      <p className="border-b px-2.5 py-1 text-xs text-muted-foreground">{game.label}</p>
      <div className="divide-y">
        <Seat leagueId={leagueId} seat={game.home} username={username} />
        <Seat leagueId={leagueId} seat={game.away} username={username} />
      </div>
    </div>
  );
}

/** One bracket, laid out as a column per round. Wide brackets scroll sideways rather than squeeze. */
export function PlayoffBracketCard({ bracket, leagueId, username, className }: { bracket: PlayoffBracket; leagueId: string; username?: string; className?: string }) {
  const winners = bracket.kind === "winners";
  return (
    <Card className={className}>
      <PanelHeader
        title={winners ? "Playoff bracket" : "Consolation bracket"}
        description={winners ? "Seeded from the regular-season standings" : "Teams outside the playoff field playing for placement"}
        actions={!bracket.started ? <Badge variant="outline">Projection</Badge> : undefined}
      />
      <CardContent>
        <div className="overflow-x-auto pb-1" tabIndex={0} aria-label={winners ? "Playoff bracket" : "Consolation bracket"}>
          <div className="flex min-w-max gap-4">
            {bracket.rounds.map((round) => (
              <div className="flex w-56 shrink-0 flex-col gap-3" key={round.round}>
                <h3 className="type-label text-muted-foreground">{round.label}</h3>
                <div className="flex flex-1 flex-col justify-around gap-3">
                  {round.games.map((game) => <Game game={game} key={game.id} leagueId={leagueId} username={username} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
