import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ScoutingReportView } from "@/components/scouting-report";
import type { ManagerProfile, ScoutingReport } from "@/lib/scouting-report";

const profile = (rosterId: number, name: string): ManagerProfile => ({
  rosterId, name, manager: name, userId: `${rosterId}`, avatar: null, isUser: false,
  leverage: 60, window: "Rebuilding", record: { wins: 2, losses: 2, ties: 0 }, valueRank: 2, teams: 12,
  play: "Trade WR depth for RB scoring.", needs: [], surpluses: [], draftTendencies: [],
  tendencies: { trades: 2, tradesPerYear: 2, tradeRank: 1, style: "Active", netPlayerFlow: 0,
    netPickFlow: 3, waiverClaims: 5, faabSpent: 20, activityByDay: [0, 0, 0, 2, 0, 0, 0],
    busiestDay: null, movesPerYear: 2, partners: [], seasonsScanned: 1 },
  efficiency: null, headToHead: null, crushes: [], otherLeagues: 0, insights: [], career: null,
});
const report: ScoutingReport = {
  basis: "redraft", league: { id: "L1", name: "League", season: "2026", teams: 12, superflex: true },
  userRosterId: 3, username: "ada", profiles: [profile(1, "Alpha"), profile(2, "Beta")],
  lineage: ["L1"], seasonsScanned: 1, network: [], marketSummary: "Dynasty market summary",
  marketCounts: { rebuilding: 2, contending: 0, fringe: 0 }, valuesReady: true, historyReady: true, crossLeagueReady: true,
};

describe("ScoutingReportView", () => {
  it("uses scoring context and waiver history for redraft instead of dynasty windows and picks", () => {
    render(<ScoutingReportView report={report} />);
    expect(screen.queryByText("Rebuilding")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rebuilders" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Has picks" })).not.toBeInTheDocument();
    expect(screen.queryByText("Net pick flow")).not.toBeInTheDocument();
    expect(screen.getByText("Waiver claims")).toBeInTheDocument();
    expect(screen.queryByText("Trade opportunities")).not.toBeInTheDocument();
  });
  it("switches one shared dossier with manager buttons and supports searching", async () => {
    render(<ScoutingReportView report={report} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Beta" }));
    expect(screen.getByRole("button", { name: "Beta" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Beta" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Alpha" })).not.toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Search managers" }), "missing");
    expect(screen.getByText("No managers match")).toBeInTheDocument();
  });
  it("retains dynasty windows but hides scoring suggestions during a value outage", () => {
    const { rerender } = render(<ScoutingReportView report={{ ...report, basis: "dynasty" }} />);
    expect(screen.getByText("Rebuilding")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rebuilders" })).toBeInTheDocument();
    rerender(<ScoutingReportView report={{ ...report, basis: "dynasty", valuesReady: false }} />);
    expect(screen.queryByText("Rebuilding")).not.toBeInTheDocument();
    expect(screen.queryByText("Trade WR depth for RB scoring.")).not.toBeInTheDocument();
    expect(screen.getByText(/Position needs and trade-fit suggestions will return/)).toBeInTheDocument();
  });
});
