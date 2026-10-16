import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RosterEdgeChart } from "@/components/roster-edge-chart";
import type { PositionRoom } from "@/lib/league-values";
import type { PositionScarcity } from "@/lib/team-insights";

const room = (position: string, value: number, rank: number, leagueAvg: number): PositionRoom => ({ position, value, players: 2, avgAge: 26, rank, leagueAvg });
const scarcity = (position: PositionScarcity["position"], values: number[], userIndex: number): PositionScarcity => ({
  position, topThreeShare: 0,
  rows: values.map((value, index) => ({ rosterId: index + 1, name: `Team ${index + 1}`, manager: `m${index}`, value, isUser: index === userIndex })),
});

describe("roster edge chart", () => {
  it("summarizes each room's rank and gap to the league average", () => {
    render(<RosterEdgeChart rooms={[room("QB", 22, 1, 20), room("RB", 18, 3, 20)]} scarcity={[scarcity("QB", [22, 20, 18], 0), scarcity("RB", [22, 20, 18], 2)]} teams={3} isDynasty={false} />);
    expect(screen.getByText("QB: 1st of 3, +10% vs league average")).toBeInTheDocument();
    expect(screen.getByText("RB: 3rd of 3, −10% vs league average")).toBeInTheDocument();
  });

  it("names the team under the pointer", () => {
    const { container } = render(<RosterEdgeChart rooms={[room("WR", 30, 2, 30)]} scarcity={[scarcity("WR", [36, 30, 24], 1)]} teams={3} isDynasty={false} />);
    const dots = container.querySelectorAll("span.rounded-full");
    fireEvent.pointerEnter(dots[0]);
    expect(screen.getByText("Team 1")).toBeInTheDocument();
    expect(screen.getByText(/36\.0 PPG/)).toBeInTheDocument();
  });

  it("says when a position has no league baseline", () => {
    render(<RosterEdgeChart rooms={[room("TE", 0, 1, 0)]} scarcity={[scarcity("TE", [0, 0], 0)]} teams={2} isDynasty={false} />);
    expect(screen.getByText("No baseline")).toBeInTheDocument();
  });
});
