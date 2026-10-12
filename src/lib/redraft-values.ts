/** Raw season projected points per game, rounded consistently across every surface. */
export type ProjectedPlayer = { sleeperId: string; position: string; ppg: number };

export function toProjectedPpg(players: ProjectedPlayer[]): Map<string, number> {
  return new Map(players.filter(player => Number.isFinite(player.ppg))
    .map(player => [player.sleeperId, Math.round(player.ppg * 10) / 10]));
}
