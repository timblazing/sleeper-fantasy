"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowUpRightIcon,
  ChevronRightIcon,
  RadioIcon,
  RefreshCwIcon,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLiveNfl } from "@/hooks/use-live-nfl";
import type {
  GameSummary,
  NflScoreboard,
  ScoreboardGame,
  ScoreboardTeam,
} from "@/lib/nfl-scoreboard";
import { cn } from "@/lib/utils";

function kickoff(date: string) {
  return new Date(date).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function TeamLogo({ team }: { team: ScoreboardTeam }) {
  return team.logo ? (
    <Image
      unoptimized
      src={team.logo}
      alt=""
      width={36}
      height={36}
      className="size-9 shrink-0 object-contain"
    />
  ) : (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
      {team.abbreviation}
    </span>
  );
}

function GameTeams({ game }: { game: ScoreboardGame }) {
  return (
    <div className="space-y-3">
      {game.teams.map((team) => (
        <div key={team.id} className="flex items-center gap-3">
          <TeamLogo team={team} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold">
                {team.name}
              </span>
              {team.possession ? (
                <span
                  className="size-1.5 shrink-0 rounded-full bg-emerald-400"
                  title="Possession"
                >
                  <span className="sr-only">Possession</span>
                </span>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground">
              {team.record || (team.id === game.teams[0].id ? "Away" : "Home")}
            </div>
          </div>
          <span
            className={cn(
              "text-2xl font-semibold tabular-nums",
              team.winner && "text-foreground",
            )}
          >
            {team.score ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

function GameCard({
  game,
  onOpen,
}: {
  game: ScoreboardGame;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`View ${game.name} game details`}
      className="group flex min-w-0 flex-col rounded-xl border bg-card text-left shadow-xs transition-colors hover:border-foreground/30 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3 text-xs">
        <span
          className={cn(
            "font-medium",
            game.state === "live"
              ? "text-emerald-500 dark:text-emerald-400"
              : "text-muted-foreground",
          )}
        >
          {game.state === "live" ? "● " : ""}
          {game.detail}
        </span>
        <span className="truncate text-muted-foreground">
          {game.redZone && game.state === "live" ? "Red zone" : game.broadcast}
        </span>
      </div>
      <div className="w-full px-4 py-4">
        <GameTeams game={game} />
      </div>
      <div className="mt-auto flex min-h-11 items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
        <span>
          {game.state === "upcoming"
            ? kickoff(game.kickoff)
            : game.state === "live" && game.situation
              ? game.situation
              : "Box score & game details"}
        </span>
        <ChevronRightIcon className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function LoadingGames() {
  return (
    <div
      role="status"
      aria-label="Loading NFL scoreboard"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-52 animate-pulse rounded-xl border bg-muted/30"
        />
      ))}
    </div>
  );
}

export function NflScoreboardPage() {
  const { data, error, refreshing, refresh } =
    useLiveNfl<NflScoreboard>("/api/scoreboard");
  const [selected, setSelected] = useState<ScoreboardGame | null>(null);
  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Scoreboard"
        description="Every NFL game this week. Follow the action, dive into the numbers."
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <RadioIcon className="size-5 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold">
              {data
                ? `${data.season} ${data.seasonType === 1 ? "Preseason" : data.seasonType === 3 ? "Postseason" : "Season"} · Week ${data.week}`
                : "This week in the NFL"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {data ? `${data.games.length} games · ` : ""}ESPN · Updates every
              30 seconds
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data ? (
            <span className="text-xs text-muted-foreground">
              Updated{" "}
              {new Date(data.updatedAt).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCwIcon
              className={cn("size-3.5", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          {error}
          {data
            ? " Showing the last successful update."
            : " Use Refresh to retry."}
        </div>
      ) : null}
      {!data && !error ? <LoadingGames /> : null}
      {data && !data.games.length ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <h2 className="font-semibold">No games scheduled this week</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back when the next NFL slate is available.
          </p>
        </div>
      ) : null}
      {(
        [
          ["live", "Live now"],
          ["upcoming", "Upcoming"],
          ["final", "Final"],
        ] as const
      ).map(([state, title]) => {
        const games = data?.games.filter((game) => game.state === state) ?? [];
        return games.length ? (
          <section key={state} aria-label={title} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              {state === "live" ? (
                <span className="size-2 rounded-full bg-emerald-500" />
              ) : null}
              {title}
              <span className="ml-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                {games.length}
              </span>
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onOpen={() => setSelected(game)}
                />
              ))}
            </div>
          </section>
        ) : null;
      })}
      <ResponsiveDialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected?.name ?? "Game details"}
        description="NFL game details · ESPN"
        className="min-w-0 sm:max-w-4xl"
      >
        {selected ? <GameDetails key={selected.id} initial={selected} /> : null}
      </ResponsiveDialog>
    </div>
  );
}

const tableClass =
  "w-full text-left text-xs tabular-nums [&_th]:px-3 [&_th]:py-2.5 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:px-3 [&_td]:py-2.5 [&_tr]:border-b [&_tr:last-child]:border-0";
function TableScroll({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="max-w-full overflow-x-auto rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </div>
  );
}

function GameDetails({ initial }: { initial: ScoreboardGame }) {
  const { data, error, refreshing, refresh } = useLiveNfl<GameSummary>(
    `/api/scoreboard/${initial.id}`,
  );
  const game = data?.game ?? initial;
  const quarters = Math.max(
    4,
    ...game.teams.map((team) => team.quarters.length),
  );
  return (
    <div className="min-w-0 space-y-5 pt-3">
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span
            className={cn(
              "font-semibold",
              game.state === "live" && "text-emerald-500 dark:text-emerald-400",
            )}
          >
            {game.state === "live" ? "LIVE · " : ""}
            {game.detail}
          </span>
          <span className="text-muted-foreground">{initial.broadcast}</span>
        </div>
        <GameTeams game={game} />
        <p className="mt-4 text-xs text-muted-foreground">
          {game.venue || initial.venue} · {kickoff(game.kickoff)}
        </p>
      </div>
      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 text-sm text-destructive"
        >
          <p>
            {error}
            {data ? " Showing the last successful update." : ""}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={refreshing}
            onClick={refresh}
          >
            Retry
          </Button>
        </div>
      ) : null}
      {!data && !error ? (
        <p
          role="status"
          className="py-6 text-center text-sm text-muted-foreground"
        >
          Loading game details…
        </p>
      ) : null}
      {data ? (
        <>
          <TableScroll label="Quarter scores">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th scope="col">Team</th>
                  {Array.from({ length: quarters }, (_, index) => (
                    <th key={index} scope="col">
                      {index < 4
                        ? index + 1
                        : index === 4
                          ? "OT"
                          : `${index - 3}OT`}
                    </th>
                  ))}
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {game.teams.map((team) => (
                  <tr key={team.id}>
                    <th scope="row">{team.abbreviation}</th>
                    {Array.from({ length: quarters }, (_, index) => (
                      <td key={index}>{team.quarters[index] ?? "—"}</td>
                    ))}
                    <td className="font-semibold">{team.score ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <Tabs defaultValue="boxscore" className="min-w-0">
            <TabsList className="w-full">
              <TabsTrigger value="boxscore">Box score</TabsTrigger>
              <TabsTrigger value="team">Team stats</TabsTrigger>
              <TabsTrigger value="plays">Play-by-play</TabsTrigger>
            </TabsList>
            <TabsContent value="boxscore" className="min-w-0 space-y-6 pt-3">
              {data.boxscore?.players?.some((team) =>
                team.statistics?.some((s) => s.athletes?.length),
              ) ? (
                data.boxscore.players.map((team) => (
                  <section key={team.team.id} className="space-y-4">
                    <h3 className="text-sm font-semibold">
                      {team.team.displayName}
                    </h3>
                    {team.statistics
                      ?.filter((s) => s.athletes?.length)
                      .map((category) => (
                        <div key={category.name} className="space-y-2">
                          <h4 className="text-xs font-medium capitalize text-muted-foreground">
                            {category.name.replaceAll(/([A-Z])/g, " $1")}
                          </h4>
                          <TableScroll
                            label={`${team.team.displayName} ${category.name}`}
                          >
                            <table
                              className={cn(tableClass, "whitespace-nowrap")}
                            >
                              <thead>
                                <tr>
                                  <th scope="col">Player</th>
                                  {category.labels?.map((label, index) => (
                                    <th
                                      key={index}
                                      scope="col"
                                      title={category.descriptions?.[index]}
                                    >
                                      {label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {category.athletes?.map((player) => (
                                  <tr key={player.athlete.id}>
                                    <th
                                      scope="row"
                                      className="!text-foreground"
                                    >
                                      {player.athlete.displayName}
                                    </th>
                                    {player.stats.map((stat, index) => (
                                      <td key={index}>{stat}</td>
                                    ))}
                                  </tr>
                                ))}
                                {category.totals?.length ? (
                                  <tr className="bg-muted/30 font-semibold">
                                    <th scope="row">Total</th>
                                    {category.totals.map((stat, index) => (
                                      <td key={index}>{stat}</td>
                                    ))}
                                  </tr>
                                ) : null}
                              </tbody>
                            </table>
                          </TableScroll>
                        </div>
                      ))}
                  </section>
                ))
              ) : (
                <NoStats
                  upcoming={game.state === "upcoming"}
                  label="Player stats"
                />
              )}
            </TabsContent>
            <TabsContent value="team" className="min-w-0 pt-3">
              <TeamStats data={data} />
            </TabsContent>
            <TabsContent value="plays" className="min-w-0 pt-3">
              {data.plays.length ? (
                <>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Latest play first · {data.plays.length} plays
                  </p>
                  <ol className="divide-y">
                    {data.plays.map((play) => (
                      <li
                        key={play.id}
                        className={cn(
                          "space-y-2 py-4",
                          play.scoringPlay &&
                            "rounded-lg bg-emerald-500/5 px-3",
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {play.period
                              ? play.period.number > 4
                                ? "OT"
                                : `Q${play.period.number}`
                              : ""}{" "}
                            {play.clock?.displayValue}
                          </span>
                          {play.scoringPlay ? (
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              Scoring play
                            </span>
                          ) : null}
                          {play.awayScore !== undefined &&
                          play.homeScore !== undefined ? (
                            <span className="ml-auto tabular-nums">
                              {game.teams[0].abbreviation} {play.awayScore} –{" "}
                              {game.teams[1].abbreviation} {play.homeScore}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm leading-relaxed">
                          {play.text || "Play details unavailable"}
                        </p>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <NoStats
                  upcoming={game.state === "upcoming"}
                  label="Play-by-play"
                />
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
        <span>
          {data
            ? `Updated ${new Date(data.updatedAt).toLocaleTimeString()}`
            : "Game data from ESPN"}
        </span>
        <a
          href={`https://www.espn.com/nfl/game/_/gameId/${initial.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          View on ESPN
          <ArrowUpRightIcon className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

function NoStats({ upcoming, label }: { upcoming: boolean; label: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      {upcoming
        ? `${label} will appear after kickoff.`
        : `${label} are not available from ESPN yet.`}
    </p>
  );
}

function TeamStats({ data }: { data: GameSummary }) {
  const teams = data.game.teams.map((team) => ({
    ...team,
    stats:
      data.boxscore?.teams?.find((entry) => entry.team.id === team.id)
        ?.statistics ?? [],
  }));
  const stats = [
    ...new Map(
      teams.flatMap((team) => team.stats).map((stat) => [stat.name, stat]),
    ).values(),
  ];
  if (!stats.length)
    return (
      <NoStats upcoming={data.game.state === "upcoming"} label="Team stats" />
    );
  return (
    <TableScroll label="Team statistics">
      <table className={tableClass}>
        <thead>
          <tr>
            <th scope="col">Statistic</th>
            {teams.map((team) => (
              <th key={team.id} scope="col">
                {team.abbreviation}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => (
            <tr key={stat.name}>
              <th scope="row">{stat.label ?? stat.name}</th>
              {teams.map((team) => (
                <td key={team.id}>
                  {team.stats.find((s) => s.name === stat.name)?.displayValue ??
                    "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
