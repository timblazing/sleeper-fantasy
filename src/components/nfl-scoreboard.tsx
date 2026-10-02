"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowUpRightIcon } from "lucide-react";
import { Football, FieldTrack, FieldView } from "@/components/nfl-field";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLiveNfl } from "@/hooks/use-live-nfl";
import type {
  GameDrive,
  GamePlay,
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

function kickoffTime(date: string) {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function kickoffDay(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** ESPN writes "10:24 - 3rd"; a scorebug reads quarter first. */
function liveClock(detail: string) {
  const match = detail.match(/^(\d{1,2}:\d{2}) - (.+)$/);
  return match
    ? { period: match[2], clock: match[1] }
    : { period: detail, clock: "" };
}

function TeamLogo({
  team,
  size = 28,
  className,
}: {
  team: Pick<ScoreboardTeam, "logo" | "abbreviation">;
  size?: number;
  className?: string;
}) {
  return team.logo ? (
    <Image
      unoptimized
      src={team.logo}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {team.abbreviation}
    </span>
  );
}

function GameCard({
  game,
  onOpen,
}: {
  game: ScoreboardGame;
  onOpen: () => void;
}) {
  const live = game.state === "live";
  const final = game.state === "final";
  const { period, clock } = liveClock(game.detail);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`View ${game.name} game details`}
      className="flex min-w-0 flex-col rounded-xl border bg-card text-left transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="grid w-full grid-cols-[minmax(0,1fr)_7.5rem]">
        <div className="space-y-2.5 py-3.5 pr-3 pl-4">
          {game.teams.map((team) => {
            const lost = final && !team.winner;
            return (
              <div key={team.id} className="flex items-center gap-2.5">
                <TeamLogo team={team} />
                <span
                  className={cn(
                    "truncate text-sm font-semibold",
                    lost && "font-medium text-muted-foreground",
                  )}
                >
                  {team.shortName}
                </span>
                {team.possession ? <Football className="shrink-0" /> : null}
                {team.possession && game.redZone ? (
                  <span className="shrink-0 rounded-sm bg-negative/15 px-1 text-[10px] font-semibold text-negative">
                    RZ
                  </span>
                ) : null}
                <span
                  className={cn(
                    "ml-auto pl-2 font-mono text-xl font-semibold tabular-nums",
                    lost && "text-muted-foreground",
                    game.scoring?.teamId === team.id &&
                      "rounded bg-positive/15 px-1.5 text-positive",
                  )}
                >
                  {team.score ?? ""}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-0.5 border-l px-3 text-xs">
          {live ? (
            <>
              <span className="font-medium text-positive">
                {period} <span className="font-mono">{clock}</span>
              </span>
              {game.scoring ? (
                <span className="font-semibold text-positive">
                  {game.scoring.label}
                </span>
              ) : game.field?.down ? (
                <>
                  <span className="text-foreground">{game.field.down}</span>
                  <span className="text-muted-foreground">
                    {game.field.spot}
                  </span>
                </>
              ) : null}
            </>
          ) : final ? (
            <span className="font-medium">{game.detail}</span>
          ) : (
            <>
              <span className="font-medium">{kickoffTime(game.kickoff)}</span>
              <span className="truncate text-muted-foreground">
                {game.broadcast}
              </span>
            </>
          )}
        </div>
      </div>
      {live ? (
        <div className="mt-auto w-full space-y-2.5 border-t px-4 pt-3 pb-3">
          {game.field ? (
            <FieldTrack field={game.field} teams={game.teams} />
          ) : null}
          <div className="flex items-baseline gap-3 text-xs text-muted-foreground">
            <span className="min-w-0 flex-1 truncate">
              {game.lastPlay || game.situation || "Live"}
            </span>
            <span className="shrink-0">{game.broadcast}</span>
          </div>
        </div>
      ) : null}
    </button>
  );
}

function LoadingGames() {
  return (
    <div
      role="status"
      aria-label="Loading NFL scoreboard"
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-xl border bg-muted/30"
        />
      ))}
    </div>
  );
}

function weekLabel(data: NflScoreboard) {
  if (data.seasonType === 3) return "Postseason";
  if (data.seasonType === 1) return `Preseason week ${data.week}`;
  return `Week ${data.week}`;
}

export function NflScoreboardPage() {
  const { data, error } = useLiveNfl<NflScoreboard>("/api/scoreboard");
  const [selected, setSelected] = useState<ScoreboardGame | null>(null);
  const games = data?.games ?? [];
  const upcomingDays = [
    ...new Set(
      games
        .filter((g) => g.state === "upcoming")
        .map((g) => kickoffDay(g.kickoff)),
    ),
  ];
  const sections: { key: string; title: string; games: ScoreboardGame[] }[] = [
    {
      key: "live",
      title: "Live now",
      games: games.filter((g) => g.state === "live"),
    },
    ...upcomingDays.map((day) => ({
      key: day,
      title: day,
      games: games.filter(
        (g) => g.state === "upcoming" && kickoffDay(g.kickoff) === day,
      ),
    })),
    {
      key: "final",
      title: "Final",
      games: games.filter((g) => g.state === "final"),
    },
  ];
  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 p-4 md:p-6 lg:p-8">
      <header className="flex items-baseline gap-3 border-b pb-4">
        <h1 className="text-xl font-semibold tracking-tight">Scoreboard</h1>
        {data ? (
          <span className="text-sm text-muted-foreground">
            {weekLabel(data)}
          </span>
        ) : null}
      </header>
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          {error}
          {data
            ? " Showing the last successful update."
            : " Scores will retry automatically."}
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
      {sections.map((section) =>
        section.games.length ? (
          <section
            key={section.key}
            aria-label={section.title}
            className="space-y-3"
          >
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              {section.key === "live" ? (
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-positive/60 motion-reduce:hidden" />
                  <span className="relative size-2 rounded-full bg-positive" />
                </span>
              ) : null}
              {section.title}
              <span className="font-normal text-muted-foreground tabular-nums">
                {section.games.length}
              </span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {section.games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onOpen={() => setSelected(game)}
                />
              ))}
            </div>
          </section>
        ) : null,
      )}
      <ResponsiveDialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected?.name ?? "Game details"}
        visuallyHideHeader
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
  className,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "max-w-full overflow-x-auto rounded-lg border [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Scorebug({ game }: { game: ScoreboardGame }) {
  const { period, clock } = liveClock(game.detail);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
      {game.teams.map((team, index) => {
        const lost = game.state === "final" && !team.winner;
        const side = (
          <div
            key={team.id}
            className={cn(
              "flex min-w-0 items-center gap-3",
              index === 1 && "flex-row-reverse text-right",
              index === 0 ? "col-start-1" : "col-start-3",
            )}
          >
            <TeamLogo team={team} size={48} className="max-sm:!size-9" />
            <div className="min-w-0">
              <div
                className={cn(
                  "flex items-center gap-1.5 text-sm font-semibold",
                  index === 1 && "flex-row-reverse",
                  lost && "text-muted-foreground",
                )}
              >
                <span className="truncate max-sm:hidden">{team.name}</span>
                <span className="sm:hidden">{team.abbreviation}</span>
                {team.possession ? (
                  <Football className="shrink-0 max-sm:hidden" />
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground">
                {team.record || (index === 0 ? "Away" : "Home")}
              </div>
            </div>
            <span
              className={cn(
                "ml-auto font-mono text-3xl font-semibold tabular-nums sm:text-4xl",
                index === 1 && "mr-auto ml-0",
                lost && "text-muted-foreground",
              )}
            >
              {team.score ?? ""}
            </span>
          </div>
        );
        return side;
      })}
      <div className="col-start-2 row-start-1 min-w-16 text-center text-xs">
        {game.state === "live" ? (
          <div className="text-positive">
            <div className="font-semibold">{period}</div>
            <div className="font-mono">{clock}</div>
          </div>
        ) : game.state === "final" ? (
          <div className="font-semibold">{game.detail}</div>
        ) : (
          <div>
            <div className="font-semibold">{kickoffTime(game.kickoff)}</div>
            <div className="text-muted-foreground">
              {new Date(game.kickoff).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LineScore({ game }: { game: ScoreboardGame }) {
  const quarters = Math.max(
    4,
    ...game.teams.map((team) => team.quarters.length),
  );
  return (
    <TableScroll label="Quarter scores" className="border-0 bg-muted/30">
      <table
        className={cn(
          tableClass,
          "[&_td]:text-center [&_th]:text-center [&_th:first-child]:text-left",
        )}
      >
        <thead>
          <tr>
            <th scope="col">Team</th>
            {Array.from({ length: quarters }, (_, index) => (
              <th key={index} scope="col">
                {index < 4 ? index + 1 : index === 4 ? "OT" : `${index - 3}OT`}
              </th>
            ))}
            <th scope="col">T</th>
          </tr>
        </thead>
        <tbody>
          {game.teams.map((team) => (
            <tr key={team.id}>
              <th scope="row" className="!text-foreground">
                {team.abbreviation}
              </th>
              {Array.from({ length: quarters }, (_, index) => (
                <td key={index} className="font-mono">
                  {team.quarters[index] ?? "–"}
                </td>
              ))}
              <td className="font-mono font-semibold">{team.score ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

function playTime(play: GamePlay) {
  const period = play.period
    ? play.period.number > 4
      ? "OT"
      : `Q${play.period.number}`
    : "";
  return [period, play.clock?.displayValue].filter(Boolean).join(" ");
}

function DriveTracker({
  game,
  latest,
}: {
  game: ScoreboardGame;
  latest: GamePlay | undefined;
}) {
  const field = game.field;
  const scorer = game.teams.find((team) => team.id === game.scoring?.teamId);
  const facts = field
    ? [
        ["Down", field.down || "—"],
        ["Ball on", field.spot || "—"],
        // The drive clock crowds the column on phones; plays and yards carry the story.
        [
          "Drive",
          field.drive.replace(/ yards?/, " yds").replace(/, \d+:\d{2}$/, "") ||
            "New drive",
        ],
      ]
    : [];
  return (
    <section
      aria-label="Field position"
      className="rounded-xl border p-4 sm:p-5"
    >
      {game.scoring ? (
        <div className="flex items-center justify-center gap-3 pb-4">
          {scorer ? <TeamLogo team={scorer} size={32} /> : null}
          <span className="text-xl font-semibold tracking-tight text-positive">
            {game.scoring.label}
          </span>
        </div>
      ) : field ? (
        <dl className="grid grid-cols-3 divide-x pb-4 text-center">
          {facts.map(([label, value]) => (
            <div key={label} className="min-w-0 px-2">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-balance sm:text-base">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {field ? <FieldView field={field} teams={game.teams} /> : null}
      {latest?.text ? (
        <div className="mt-4 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Last play
            {latest.start?.downDistanceText
              ? `, ${latest.start.downDistanceText}`
              : ""}
          </p>
          <p className="mt-1 text-sm leading-relaxed">
            <span className="font-mono text-muted-foreground">
              {latest.clock?.displayValue}
            </span>{" "}
            {latest.text}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function GameDetails({ initial }: { initial: ScoreboardGame }) {
  const { data, error, refreshing, refresh } = useLiveNfl<GameSummary>(
    `/api/scoreboard/${initial.id}`,
  );
  const game = data?.game ?? initial;
  const latest = data?.drives[0]?.plays[0];
  const playCount =
    data?.drives.reduce((sum, drive) => sum + drive.plays.length, 0) ?? 0;
  const venue = game.venue || initial.venue;
  return (
    <div className="min-w-0 space-y-4 pt-3">
      <section aria-label="Score" className="overflow-hidden rounded-xl border">
        <div className="p-4 sm:p-5">
          <Scorebug game={game} />
          <p className="mt-4 text-center text-xs text-balance text-muted-foreground">
            {[
              initial.broadcast,
              venue,
              game.state === "upcoming" ? null : kickoff(game.kickoff),
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
        {data && game.state !== "upcoming" ? (
          <div className="border-t">
            <LineScore game={game} />
          </div>
        ) : null}
      </section>
      {game.state === "live" && (game.field || game.scoring) ? (
        <DriveTracker game={game} latest={latest} />
      ) : null}
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
        <Tabs
          defaultValue={initial.state === "live" ? "plays" : "boxscore"}
          className="min-w-0 pt-1"
        >
          <TabsList variant="line" className="w-full justify-start border-b">
            <TabsTrigger value="plays">Play-by-play</TabsTrigger>
            <TabsTrigger value="boxscore">Box score</TabsTrigger>
            <TabsTrigger value="team">Team stats</TabsTrigger>
          </TabsList>
          <TabsContent value="plays" className="min-w-0 pt-3">
            {data.drives.length ? (
              <>
                <p className="mb-4 text-xs text-muted-foreground">
                  {data.drives.length} drives, {playCount} plays. Latest first.
                </p>
                <ol className="space-y-6">
                  {data.drives.map((drive, index) => (
                    <DriveItem
                      key={drive.id}
                      drive={drive}
                      game={game}
                      current={index === 0 && game.state === "live"}
                    />
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
          <TabsContent value="boxscore" className="min-w-0 space-y-6 pt-3">
            <BoxScore data={data} />
          </TabsContent>
          <TabsContent value="team" className="min-w-0 pt-3">
            <TeamStats data={data} />
          </TabsContent>
        </Tabs>
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

function DriveItem({
  drive,
  game,
  current,
}: {
  drive: GameDrive;
  game: ScoreboardGame;
  current: boolean;
}) {
  const team = game.teams.find((t) => t.id === drive.teamId);
  return (
    <li>
      <div className="flex items-center gap-2.5">
        {team ? <TeamLogo team={team} size={22} /> : null}
        <span className="text-sm font-semibold">
          {current ? "Current drive" : drive.result || "Drive"}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {drive.summary}
        </span>
      </div>
      <ol
        className="mt-2 ml-[10px] space-y-3 border-l-2 pl-4"
        style={{ borderColor: team?.color ?? undefined }}
      >
        {drive.plays.map((play) => (
          <li key={play.id} className="text-sm">
            <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
              <span className="font-mono">{playTime(play)}</span>
              {play.start?.downDistanceText ? (
                <span>{play.start.downDistanceText}</span>
              ) : null}
              {play.scoringPlay ? (
                <span className="ml-auto font-mono font-medium text-positive tabular-nums">
                  {game.teams[0].abbreviation} {play.awayScore},{" "}
                  {game.teams[1].abbreviation} {play.homeScore}
                </span>
              ) : null}
            </div>
            <p
              className={cn(
                "mt-0.5 leading-relaxed",
                play.scoringPlay && "font-medium text-positive",
              )}
            >
              {play.text || "Play details unavailable"}
            </p>
          </li>
        ))}
      </ol>
    </li>
  );
}

function BoxScore({ data }: { data: GameSummary }) {
  const players = data.boxscore?.players;
  if (
    !players?.some((team) => team.statistics?.some((s) => s.athletes?.length))
  )
    return (
      <NoStats upcoming={data.game.state === "upcoming"} label="Player stats" />
    );
  return players.map((team) => (
    <section key={team.team.id} className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <TeamLogo
          team={{
            logo: team.team.logo ?? team.team.logos?.[0]?.href ?? null,
            abbreviation: team.team.abbreviation,
          }}
          size={22}
        />
        {team.team.displayName}
      </h3>
      {team.statistics
        ?.filter((s) => s.athletes?.length)
        .map((category) => (
          <div key={category.name} className="space-y-2">
            <h4 className="text-xs font-medium capitalize text-muted-foreground">
              {category.name.replaceAll(/([A-Z])/g, " $1")}
            </h4>
            <TableScroll label={`${team.team.displayName} ${category.name}`}>
              <table className={cn(tableClass, "whitespace-nowrap")}>
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
                      <th scope="row" className="!text-foreground">
                        {player.athlete.displayName}
                      </th>
                      {player.stats.map((stat, index) => (
                        <td key={index} className="font-mono">
                          {stat}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {category.totals?.length ? (
                    <tr className="bg-muted/30 font-semibold">
                      <th scope="row">Total</th>
                      {category.totals.map((stat, index) => (
                        <td key={index} className="font-mono">
                          {stat}
                        </td>
                      ))}
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </TableScroll>
          </div>
        ))}
    </section>
  ));
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
  const [away, home] = teams;
  const value = (team: (typeof teams)[number], name: string) =>
    team.stats.find((s) => s.name === name)?.displayValue ?? "—";
  return (
    <TableScroll label="Team statistics">
      <table className={cn(tableClass, "[&_td]:font-mono")}>
        <thead>
          <tr>
            <th scope="col" className="w-1/4">
              <span className="flex items-center gap-2 !text-foreground">
                <TeamLogo team={away} size={20} />
                {away.abbreviation}
              </span>
            </th>
            <th scope="col" className="text-center">
              <span className="sr-only">Statistic</span>
            </th>
            <th scope="col" className="w-1/4">
              <span className="flex items-center justify-end gap-2 !text-foreground">
                {home.abbreviation}
                <TeamLogo team={home} size={20} />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => (
            <tr key={stat.name}>
              <td>{value(away, stat.name)}</td>
              <th scope="row" className="text-center !font-normal">
                {stat.label ?? stat.name}
              </th>
              <td className="text-right">{value(home, stat.name)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
