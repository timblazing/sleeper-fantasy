"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Football, FieldView } from "@/components/nfl-field";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { ResponsiveTabs } from "@/components/responsive-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
  return new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
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
        "flex shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {team.abbreviation}
    </span>
  );
}

/** The top bar shows only live games and keeps the existing game details dialog. */
export function NflScoreTicker() {
  const { data } = useLiveNfl<NflScoreboard>("/api/scoreboard");
  const [selected, setSelected] = useState<ScoreboardGame | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const games = useMemo(() => data?.games.filter((game) => game.state === "live") ?? [], [data?.games]);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const updateOverflow = () => setHasOverflow(element.scrollWidth > element.clientWidth + 1);
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(element);
    window.addEventListener("resize", updateOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [games]);

  const gameButton = (game: ScoreboardGame) => {
    const { period, clock } = liveClock(game.detail);
    return (
      <button key={game.id} type="button" onClick={() => setSelected(game)} aria-label={`View ${game.name} game details`}
        className="group flex min-w-[10.5rem] shrink-0 items-center gap-2 rounded-lg border bg-card/80 px-2.5 py-1.5 text-left hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="min-w-0 flex-1 space-y-1">
          {game.teams.map((team) => (
            <div key={team.id} className="flex min-w-0 items-center gap-1.5">
              <TeamLogo team={team} size={18} />
              <span className="truncate text-xs font-medium">{team.abbreviation}</span>
              <span className="ml-auto text-xs font-semibold tabular-nums">{team.score ?? "0"}</span>
            </div>
          ))}
        </div>
        <span className="w-[3.35rem] shrink-0 text-[10px] leading-tight text-positive">
          <span className="mb-0.5 flex items-center gap-1"><span className="size-1.5 rounded-full bg-positive" />{period}</span>{clock}
        </span>
      </button>
    );
  };

  if (!games.length) return null;

  return <>
    <section aria-label="Live NFL scores" className="flex w-full min-w-0 max-w-full flex-1 items-center gap-1.5 sm:max-w-[min(56vw,46rem)]">
      {hasOverflow ? <button type="button" aria-label="Scroll scores left" onClick={() => track.current?.scrollBy({ left: -190, behavior: "smooth" })} className="hidden size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted sm:flex"><ChevronLeftIcon className="size-4" /></button> : null}
      <div ref={track} className="flex min-w-0 gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {games.map(gameButton)}
      </div>
      {hasOverflow ? <button type="button" aria-label="Scroll scores right" onClick={() => track.current?.scrollBy({ left: 190, behavior: "smooth" })} className="hidden size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted sm:flex"><ChevronRightIcon className="size-4" /></button> : null}
    </section>
    <ResponsiveDialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }} title={selected?.name ?? "Game details"} visuallyHideHeader className="min-w-0 sm:max-w-4xl">
      {selected ? <GameDetails key={selected.id} initial={selected} /> : null}
    </ResponsiveDialog>
  </>;
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
                  "flex items-center gap-1.5 text-sm font-medium",
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
                "ml-auto  text-3xl font-medium tabular-nums sm:text-4xl",
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
            <div className="font-medium">{period}</div>
            <div className="tabular-nums">{clock}</div>
          </div>
        ) : game.state === "final" ? (
          <div className="font-medium">{game.detail}</div>
        ) : (
          <div>
            <div className="font-medium">{kickoffTime(game.kickoff)}</div>
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
                <td key={index} className="tabular-nums">
                  {team.quarters[index] ?? "–"}
                </td>
              ))}
              <td className="tabular-nums font-medium">{team.score ?? "–"}</td>
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
          <span className="text-xl font-medium tracking-tight text-positive">
            {game.scoring.label}
          </span>
        </div>
      ) : field ? (
        <dl className="grid grid-cols-3 divide-x pb-4 text-center">
          {facts.map(([label, value]) => (
            <div key={label} className="min-w-0 px-2">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-balance sm:text-base">
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
            <span className="tabular-nums text-muted-foreground">
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
  const [detailTab, setDetailTab] = useState(initial.state === "live" ? "plays" : "boxscore");
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
          value={detailTab}
          onValueChange={setDetailTab}
          className="min-w-0 pt-1"
        >
          <ResponsiveTabs label="Game details" value={detailTab} onValueChange={setDetailTab} items={[
            { value: "plays", label: "Play-by-play" }, { value: "boxscore", label: "Box score" }, { value: "team", label: "Team stats" },
          ]} />
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
        <span className="text-sm font-medium">
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
              <span className="tabular-nums">{playTime(play)}</span>
              {play.start?.downDistanceText ? (
                <span>{play.start.downDistanceText}</span>
              ) : null}
              {play.scoringPlay ? (
                <span className="ml-auto font-medium text-positive tabular-nums">
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
      <h3 className="flex items-center gap-2 text-sm font-medium">
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
                        <td key={index} className="tabular-nums">
                          {stat}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {category.totals?.length ? (
                    <tr className="bg-muted/30 font-medium">
                      <th scope="row">Total</th>
                      {category.totals.map((stat, index) => (
                        <td key={index} className="tabular-nums">
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
      <table className={cn(tableClass, "[&_td]:tabular-nums")}>
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
