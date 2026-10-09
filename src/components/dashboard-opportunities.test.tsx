import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPriorities } from "@/components/dashboard-opportunities";
import type { OverviewData, RecommendedAction } from "@/lib/team-insights";

// These fixtures exercise the card's failure path and simultaneous lineup warnings.
function priorities(actions: RecommendedAction[] = [], matchupAvailable = true): OverviewData {
  return { actions, team: { rosterId: 1 }, matchup: matchupAvailable ? { id: 1 } : null } as OverviewData;
}

describe("dashboard priorities", () => {
  it("keeps all warnings visible when several starters need attention", () => {
    const actions = ["Empty slots", "Starter A out", "Starter B out", "Bye starters", "Injury watch"].map((title, index): RecommendedAction => ({
      id: String(index), tone: "critical", label: "Lineup", title, detail: "Check starters", href: null, cta: null,
    }));
    render(<DashboardPriorities data={priorities(actions)} />);
    for (const action of actions) expect(screen.getByText(action.title)).toBeVisible();
    expect(screen.getByText("5 priorities")).toBeVisible();
  });

  it("does not clear the lineup when matchup data is unavailable", () => {
    render(<DashboardPriorities data={priorities([], false)} />);
    expect(screen.getByText(/Lineup checks are unavailable/)).toBeVisible();
    expect(screen.queryByText(/No lineup warnings found/)).not.toBeInTheDocument();
  });
});
