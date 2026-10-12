import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlayerDetail } from "@/components/player/player-detail";
import { specimenProfile, specimenContext } from "@/lib/design-specimens";

vi.mock("@/components/player/player-percentiles", () => ({ PlayerPercentiles: () => null }));
vi.mock("@/components/player/player-projection", () => ({ PlayerProjection: () => null }));
vi.mock("@/components/player/player-usage", () => ({ PlayerSnapTrend: () => null }));
vi.mock("@/components/player/player-weekly-chart", () => ({ PlayerWeeklyChart: () => null }));

describe("player scoring units", () => {
  it("shows raw projected PPG and separate season PPG without dynasty pricing in redraft", () => {
    render(<PlayerDetail profile={specimenProfile} context={specimenContext} leagueId="L1" isSuperflex basis="redraft" projectedPpg={21.4} projectedRankPosition={3} projectedRankOverall={12} />);
    expect(screen.getByText("Projected PPG · PPR")).toBeInTheDocument();
    expect(screen.getByText("21.4")).toBeInTheDocument();
    expect(screen.getByText("Season PPG")).toBeInTheDocument();
    expect(screen.getByText("Projected rank")).toBeInTheDocument();
    expect(screen.queryByText("Dynasty rank")).not.toBeInTheDocument();
    expect(screen.queryByText(/Dynasty value/)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("PPG+");
  });
});
