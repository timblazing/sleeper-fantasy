import { buildStandings, getLeagueBase } from "@/lib/league-context";
import { liveSource, type LeagueSource } from "@/lib/league-source";
import { liveForecast, liveWinProbability, scoreProjection, type LiveForecast, type WeeklyProjection } from "@/lib/projections";
import { buildStarterSlots } from "@/lib/roster-board";
import type { MatchupDetail, MatchupSide, NflPlayer, PlayerGame, SleeperMatchup, StandingRow } from "@/lib/types";

export type MatchupBoard = { leagueName: string; season: string; week: number; matchups: MatchupDetail[]; byes: StandingRow[] };

export async function getMatchupBoard(leagueId: string, week: number, source: LeagueSource = liveSource): Promise<MatchupBoard> {
  const [base, catalog] = await Promise.all([
    getLeagueBase(leagueId, source),
    source.getPlayerCatalog().catch(() => new Map<string, NflPlayer>()),
  ]);
  const { league, state, regularSeason } = base;
  const [rows, games, projections, homeAway] = await Promise.all([
    source.getMatchups(leagueId, week).catch(() => [] as SleeperMatchup[]),
    regularSeason ? source.getWeekGamesByTeam(state.season, week).catch(() => new Map<string, PlayerGame>()) : Promise.resolve(new Map<string, PlayerGame>()),
    source.getWeeklyProjections(league.season, week).catch(() => new Map<string, WeeklyProjection>()),
    // Sleeper's projections name the opponent but not the side, so the "vs"/"@" on a projected
    // line comes from ESPN's schedule. Unlike the live slate this is fetched in the preseason too,
    // where the projected week is the one the schedule already covers.
    source.getWeekHomeAwayByTeam(league.season, week).catch(() => new Map<string, boolean>()),
  ]);

  // The shared builder ranks the rows; this board shows a single week, so the rank is not meaningful here.
  const teamByRoster = new Map<number, StandingRow>(buildStandings(base).map((row) => [row.rosterId, { ...row, rank: 0 }]));

  // The forecast informs the win probability but is not part of the rendered side, so it rides
  // alongside rather than inside `MatchupSide`.
  const forecasts = new Map<number, LiveForecast | null>();

  const toSide = (row: SleeperMatchup): MatchupSide | null => {
    const team = teamByRoster.get(row.roster_id);
    if (!team) return null;
    const starters = row.starters ?? [];
    const slots = buildStarterSlots(league, starters, catalog, games, row.starters_points).map((slot) => {
      const projection = slot.player ? projections.get(slot.player.id) : undefined;
      return {
        ...slot,
        projection: scoreProjection(projection?.stats, league.scoring_settings),
        projectionOpponent: projection?.opponent ?? null,
        projectionHome: slot.player?.team ? homeAway.get(slot.player.team) ?? null : null,
      };
    });
    const startersSet = new Set(starters);
    const benchPoints = Object.entries(row.players_points ?? {}).reduce((sum, [id, value]) => (startersSet.has(id) ? sum : sum + value), 0);
    const occupied = slots.filter(slot => slot.player);
    const complete = occupied.every(slot => slot.game?.state === "post" || slot.game?.bye || slot.projection !== null);
    const forecast = complete ? liveForecast(occupied.map(slot => ({ points: slot.points, projection: slot.projection, state: slot.game?.bye ? "post" : slot.game?.state ?? null, period: slot.game?.period, clockSeconds: slot.game?.clockSeconds }))) : null;
    // Anchor to Sleeper's official score so scoring adjustments are retained. Add only
    // the unfinished portion, rather than summing pregame projections for completed games.
    const banked = occupied.reduce((sum, slot) => sum + (slot.points ?? 0), 0);
    const projectedScore = forecast ? forecast.mean + (row.points ?? banked) - banked : null;
    forecasts.set(row.roster_id, forecast && projectedScore !== null ? { ...forecast, mean: projectedScore } : null);
    return { team, score: row.points ?? 0, projectedScore, slots, benchPoints };
  };

  const grouped = new Map<number, SleeperMatchup[]>();
  const byes: StandingRow[] = [];
  for (const row of rows) {
    if (row.matchup_id == null) { const team = teamByRoster.get(row.roster_id); if (team) byes.push(team); continue; }
    const group = grouped.get(row.matchup_id) ?? [];
    group.push(row);
    grouped.set(row.matchup_id, group);
  }

  const matchups = [...grouped.entries()].flatMap(([id, pair]) => {
    if (pair.length < 2) { const solo = teamByRoster.get(pair[0].roster_id); if (solo) byes.push(solo); return []; }
    const home = toSide(pair[0]);
    const away = toSide(pair[1]);
    if (!home || !away) return [];
    const homeForecast = forecasts.get(pair[0].roster_id);
    const awayForecast = forecasts.get(pair[1].roster_id);
    const homeWinProbability = homeForecast && awayForecast ? liveWinProbability(homeForecast, awayForecast) : null;
    return [{ id, home, away, homeWinProbability, awayWinProbability: homeWinProbability == null ? null : 100 - homeWinProbability }];
  }).toSorted((a, b) => a.id - b.id);

  return { leagueName: league.name, season: league.season, week, matchups, byes };
}

/** Keep each team's probability attached when putting the connected roster on the left. */
export function matchupForRoster(matchup: MatchupDetail, rosterId: number): MatchupDetail {
  if (matchup.away.team.rosterId !== rosterId) return matchup;
  return {
    ...matchup,
    home: matchup.away,
    away: matchup.home,
    homeWinProbability: matchup.awayWinProbability,
    awayWinProbability: matchup.homeWinProbability,
  };
}
