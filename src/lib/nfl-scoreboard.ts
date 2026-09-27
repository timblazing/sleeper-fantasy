import { z } from "zod";

const team = z.object({
  id: z.string(),
  displayName: z.string(),
  abbreviation: z.string(),
  logo: z.string().optional(),
  logos: z.array(z.object({ href: z.string() })).optional(),
});
const record = z.object({
  type: z.string().optional(),
  summary: z.string().optional(),
});
const competitor = z.object({
  homeAway: z.string(),
  team,
  score: z.string().optional(),
  winner: z.boolean().optional(),
  possession: z.boolean().optional(),
  records: z.array(record).optional(),
  record: z.array(record).optional(),
  linescores: z
    .array(
      z.object({
        value: z.number().optional(),
        displayValue: z.string().optional(),
        period: z.number().optional(),
      }),
    )
    .optional(),
});
const status = z.object({
  type: z.object({
    state: z.string(),
    name: z.string().optional(),
    completed: z.boolean().optional(),
    shortDetail: z.string().optional(),
    detail: z.string().optional(),
  }),
});
const competition = z.object({
  date: z.string(),
  competitors: z.array(competitor),
  status: status.optional(),
  venue: z.object({ fullName: z.string().optional() }).optional(),
  broadcasts: z
    .array(z.object({ names: z.array(z.string()).optional() }))
    .optional(),
  situation: z
    .object({
      downDistanceText: z.string().optional(),
      possession: z.string().optional(),
      isRedZone: z.boolean().optional(),
      lastPlay: z.object({ text: z.string().optional() }).optional(),
    })
    .optional(),
});
const event = z.object({
  id: z.string(),
  name: z.string().optional(),
  status: status.optional(),
  competitions: z.array(competition),
});
export const scoreboardSchema = z.object({
  season: z.object({ year: z.number(), type: z.number() }),
  week: z.object({ number: z.number() }),
  events: z.array(event),
});
const play = z.object({
  id: z.string(),
  sequenceNumber: z.string().optional(),
  text: z.string().optional(),
  period: z.object({ number: z.number() }).optional(),
  clock: z.object({ displayValue: z.string() }).optional(),
  scoringPlay: z.boolean().optional(),
  awayScore: z.number().optional(),
  homeScore: z.number().optional(),
});
const drive = z.object({ plays: z.array(play).optional() });
export const summarySchema = z.object({
  header: event,
  gameInfo: z
    .object({ venue: z.object({ fullName: z.string().optional() }).optional() })
    .optional(),
  boxscore: z
    .object({
      teams: z
        .array(
          z.object({
            team,
            statistics: z
              .array(
                z.object({
                  name: z.string(),
                  label: z.string().optional(),
                  displayValue: z.string(),
                }),
              )
              .optional(),
          }),
        )
        .optional(),
      players: z
        .array(
          z.object({
            team,
            statistics: z
              .array(
                z.object({
                  name: z.string(),
                  text: z.string().optional(),
                  labels: z.array(z.string()).optional(),
                  descriptions: z.array(z.string()).optional(),
                  athletes: z
                    .array(
                      z.object({
                        athlete: z.object({
                          id: z.string(),
                          displayName: z.string(),
                        }),
                        stats: z.array(z.string()),
                      }),
                    )
                    .optional(),
                  totals: z.array(z.string()).optional(),
                }),
              )
              .optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  drives: z
    .object({ previous: z.array(drive).optional(), current: drive.optional() })
    .optional(),
});

export type ScoreboardTeam = {
  id: string;
  name: string;
  abbreviation: string;
  logo: string | null;
  score: string | null;
  record: string;
  winner: boolean;
  possession: boolean;
  quarters: string[];
};
export type ScoreboardGame = {
  id: string;
  name: string;
  kickoff: string;
  state: "live" | "upcoming" | "final";
  detail: string;
  venue: string;
  broadcast: string;
  situation: string;
  lastPlay: string;
  redZone: boolean;
  teams: ScoreboardTeam[];
};
export type NflScoreboard = {
  season: number;
  seasonType: number;
  week: number;
  games: ScoreboardGame[];
  updatedAt: string;
};
export type GameSummary = {
  game: ScoreboardGame;
  boxscore: z.infer<typeof summarySchema>["boxscore"];
  plays: z.infer<typeof play>[];
  updatedAt: string;
};

export function normalizeGame(
  input: z.infer<typeof event>,
): ScoreboardGame | null {
  const c = input.competitions[0];
  if (
    !c ||
    !c.competitors.some((t) => t.homeAway === "home") ||
    !c.competitors.some((t) => t.homeAway === "away")
  )
    return null;
  const s = c.status?.type ?? input.status?.type;
  const state =
    s?.completed || s?.state === "post"
      ? "final"
      : s?.state === "in"
        ? "live"
        : "upcoming";
  const teams = [...c.competitors]
    .sort(
      (a, b) => Number(a.homeAway === "home") - Number(b.homeAway === "home"),
    )
    .map((t) => ({
      id: t.team.id,
      name: t.team.displayName,
      abbreviation: t.team.abbreviation,
      logo: t.team.logo ?? t.team.logos?.[0]?.href ?? null,
      score: state === "upcoming" ? null : (t.score ?? null),
      record:
        (t.records ?? t.record)?.find((r) => r.type === "total")?.summary ?? "",
      winner: t.winner ?? false,
      possession:
        state === "live" &&
        (t.possession === true || c.situation?.possession === t.team.id),
      quarters: (t.linescores ?? []).map(
        (q) => q.displayValue ?? String(q.value ?? "—"),
      ),
    }));
  return {
    id: input.id,
    name: input.name ?? teams.map((t) => t.name).join(" at "),
    kickoff: c.date,
    state,
    detail:
      s?.name === "STATUS_SCHEDULED"
        ? "Scheduled"
        : (s?.shortDetail ?? s?.detail ?? "Scheduled"),
    venue: c.venue?.fullName ?? "",
    broadcast: c.broadcasts?.flatMap((b) => b.names ?? []).join(" · ") ?? "",
    situation: c.situation?.downDistanceText ?? "",
    lastPlay: c.situation?.lastPlay?.text ?? "",
    redZone: c.situation?.isRedZone ?? false,
    teams,
  };
}

export function normalizeScoreboard(raw: unknown): NflScoreboard {
  const data = scoreboardSchema.parse(raw);
  return {
    season: data.season.year,
    seasonType: data.season.type,
    week: data.week.number,
    games: data.events
      .map(normalizeGame)
      .filter((g): g is ScoreboardGame => g !== null)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeSummary(raw: unknown): GameSummary {
  const data = summarySchema.parse(raw);
  const game = normalizeGame(data.header);
  if (!game) throw new Error("Missing game competitors");
  game.venue = data.gameInfo?.venue?.fullName ?? game.venue;
  const plays = [
    ...(data.drives?.previous ?? []),
    ...(data.drives?.current ? [data.drives.current] : []),
  ].flatMap((d) => d.plays ?? []);
  return {
    game,
    boxscore: data.boxscore,
    plays: [...new Map(plays.map((p) => [p.id, p])).values()].sort(
      (a, b) =>
        Number(b.sequenceNumber ?? b.id) - Number(a.sequenceNumber ?? a.id),
    ),
    updatedAt: new Date().toISOString(),
  };
}
