import { PlayerCareerTable } from "sleeper-fantasy-dashboard";
import { CMC, PUKA } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

export const WideReceiver = () => <Stage><PlayerCareerTable career={PUKA.career} /></Stage>;

export const Veteran = () => <Stage><PlayerCareerTable career={CMC.career} /></Stage>;

export const Quarterback = () => (
  <Stage>
    <PlayerCareerTable
      career={[
        { season: 2024, stats: { games_played: 17, completions: 307, attempts: 483, passing_yards: 3731, passing_tds: 28, interceptions: 6, carries: 92, rushing_yards: 531, rushing_tds: 12, fantasy_points_ppr_total: 385.0, fantasy_points_ppr_avg: 22.6 } },
        { season: 2025, stats: { games_played: 17, completions: 331, attempts: 502, passing_yards: 4012, passing_tds: 31, interceptions: 9, carries: 101, rushing_yards: 588, rushing_tds: 10, fantasy_points_ppr_total: 398.7, fantasy_points_ppr_avg: 23.5 } },
      ]}
    />
  </Stage>
);
