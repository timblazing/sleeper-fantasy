import { z } from "zod";

const team = z.object({
  id: z.string(),
  displayName: z.string(),
  abbreviation: z.string(),
  shortDisplayName: z.string().optional(),
  color: z.string().optional(),
  alternateColor: z.string().optional(),
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
      down: z.number().optional(),
      distance: z.number().optional(),
      yardLine: z.number().optional(),
      downDistanceText: z.string().optional(),
      shortDownDistanceText: z.string().optional(),
      possessionText: z.string().optional(),
      possession: z.string().optional(),
      isRedZone: z.boolean().optional(),
      lastPlay: z
        .object({
          text: z.string().optional(),
          scoreValue: z.number().optional(),
          type: z.object({ text: z.string().optional() }).optional(),
          team: z.object({ id: z.string() }).optional(),
        })
        .optional(),
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
const spot = z.object({
  down: z.number().optional(),
  distance: z.number().optional(),
  yardLine: z.number().optional(),
  downDistanceText: z.string().optional(),
  shortDownDistanceText: z.string().optional(),
  possessionText: z.string().optional(),
  team: z.object({ id: z.string() }).optional(),
});
const play = z.object({
  id: z.string(),
  sequenceNumber: z.string().optional(),
  text: z.string().optional(),
  type: z.object({ text: z.string().optional() }).optional(),
  period: z.object({ number: z.number() }).optional(),
  clock: z.object({ displayValue: z.string() }).optional(),
  scoringPlay: z.boolean().optional(),
  awayScore: z.number().optional(),
  homeScore: z.number().optional(),
  start: spot.optional(),
  end: spot.optional(),
});
const drive = z.object({
  id: z.string().optional(),
  description: z.string().optional(),
  displayResult: z.string().optional(),
  team: z.object({ id: z.string() }).optional(),
  start: z
    .object({ yardLine: z.number().optional(), text: z.string().optional() })
    .optional(),
  plays: z.array(play).optional(),
});
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
  shortName: string;
  /** Primary team color as a CSS hex value. */
  color: string | null;
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
  field: FieldState | null;
  scoring: { label: string; teamId: string | null } | null;
  teams: ScoreboardTeam[];
};
/**
 * Live ball position. Yard values run 0–100 from the away team's goal line to the home
 * team's, so they map straight onto a left-to-right field with the away end zone on the left.
 */
export type FieldState = {
  ball: number;
  /** Line to gain; the goal line on goal-to-go downs, null when the feed omits it. */
  firstDown: number | null;
  driveStart: number | null;
  offense: string;
  /** 1 when the offense attacks the home (right) end zone, -1 when it attacks the away one. */
  direction: 1 | -1;
  down: string;
  spot: string;
  drive: string;
};
export type GamePlay = z.infer<typeof play>;
export type GameDrive = {
  id: string;
  teamId: string | null;
  summary: string;
  result: string;
  plays: GamePlay[];
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
  /** Newest drive first, each drive's newest play first. */
  drives: GameDrive[];
  updatedAt: string;
};

/** Converts a feed spot such as "PIT 43" or "50" to field coordinates. */
function spotToYard(
  text: string | undefined,
  yardLine: number | undefined,
  teams: ScoreboardTeam[],
) {
  const match = text?.trim().match(/^(?:([A-Z]{2,4})\s+)?(\d{1,2})$/);
  if (match) {
    const yard = Number(match[2]);
    if (!match[1] && yard === 50) return 50;
    if (match[1] === teams[0].abbreviation) return yard;
    if (match[1] === teams[1].abbreviation) return 100 - yard;
  }
  // ESPN's yardLine counts from the home goal line.
  return yardLine === undefined ? null : 100 - yardLine;
}

function fieldState(
  teams: ScoreboardTeam[],
  s: z.infer<typeof spot>,
  offense: string | undefined,
  current?: z.infer<typeof drive>,
): FieldState | null {
  const ball = spotToYard(s.possessionText, s.yardLine, teams);
  if (ball === null || !teams.some((t) => t.id === offense)) return null;
  const direction = offense === teams[0].id ? 1 : -1;
  const goal = /goal/i.test(
    s.downDistanceText ?? s.shortDownDistanceText ?? "",
  );
  const ownDrive = current?.team?.id === offense ? current : undefined;
  return {
    ball,
    firstDown: goal
      ? direction === 1
        ? 100
        : 0
      : s.distance && (s.down ?? 0) > 0
        ? Math.min(100, Math.max(0, ball + direction * s.distance))
        : null,
    driveStart: ownDrive
      ? spotToYard(ownDrive.start?.text, ownDrive.start?.yardLine, teams)
      : null,
    offense: offense!,
    direction,
    down: (s.down ?? 0) > 0 ? (s.shortDownDistanceText ?? "") : "",
    spot: s.possessionText ?? "",
    drive: ownDrive?.description ?? "",
  };
}

function hexLuminance(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Near-black primaries vanish on the dark field, so those teams use their alternate color. */
function teamColor(primary?: string, alternate?: string) {
  const valid = (c?: string) => (c && /^[0-9a-f]{6}$/i.test(c) ? c : null);
  const p = valid(primary);
  const a = valid(alternate);
  const pick = p && (hexLuminance(p) >= 0.01 || !a) ? p : a;
  return pick ? `#${pick}` : null;
}

function scoringLabel(type: string | undefined) {
  if (!type) return "Score";
  if (/touchdown/i.test(type)) return "Touchdown";
  if (/field goal/i.test(type)) return "Field goal";
  if (/safety/i.test(type)) return "Safety";
  if (/extra point/i.test(type)) return "Extra point";
  if (/two-point|2pt/i.test(type)) return "Two-point conversion";
  return type;
}

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
      shortName: t.team.shortDisplayName ?? t.team.displayName,
      color: teamColor(t.team.color, t.team.alternateColor),
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
  const situation = c.situation;
  const last = situation?.lastPlay;
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
    field:
      state === "live" && situation
        ? fieldState(teams, situation, situation.possession)
        : null,
    scoring:
      state === "live" && (last?.scoreValue ?? 0) > 0
        ? {
            label: scoringLabel(last?.type?.text),
            teamId: last?.team?.id ?? null,
          }
        : null,
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
  const order = (p: GamePlay) => Number(p.sequenceNumber ?? p.id);
  // The live drive is repeated in `current`; merge by drive ID, then keep each play once.
  const merged = new Map<string, GameDrive>();
  [
    ...(data.drives?.previous ?? []),
    ...(data.drives?.current ? [data.drives.current] : []),
  ].forEach((d, index) => {
    const id = d.id ?? `drive-${index}`;
    const plays = [...(merged.get(id)?.plays ?? []), ...(d.plays ?? [])];
    merged.set(id, {
      id,
      teamId: d.team?.id ?? null,
      summary: d.description ?? "",
      result: d.displayResult ?? "",
      plays,
    });
  });
  const seen = new Set<string>();
  const drives = [...merged.values()]
    .reverse()
    .map((d) => ({
      ...d,
      plays: d.plays
        .sort((a, b) => order(b) - order(a))
        .filter((p) => !seen.has(p.id) && seen.add(p.id)),
    }))
    .filter((d) => d.plays.length);
  const latest = drives[0]?.plays[0];
  if (game.state === "live" && latest) {
    // The summary carries no situation block; the newest play's end state is the live spot.
    const offense = latest.end?.team?.id;
    game.field =
      (latest.end &&
        fieldState(game.teams, latest.end, offense, data.drives?.current)) ??
      game.field;
    game.lastPlay = latest.text ?? game.lastPlay;
    game.scoring = latest.scoringPlay
      ? {
          label: scoringLabel(latest.type?.text),
          teamId: latest.start?.team?.id ?? offense ?? null,
        }
      : null;
  }
  return {
    game,
    boxscore: data.boxscore,
    drives,
    updatedAt: new Date().toISOString(),
  };
}
