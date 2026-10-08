import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TeamDetail } from "@/components/team/team-detail";
import type { LeagueTeam, ValuedPlayer } from "@/lib/league-values";
import { makePlayer } from "@/lib/test/fixtures";

const player = (id: string): ValuedPlayer => ({ player: makePlayer({ id, name: `Player ${id}`, position: "RB" }), value: 1000, rankOverall: 20, rankPosition: 3, ownerRosterId: 1, ownerName: "Long Team Name" });
const team: LeagueTeam = { rosterId: 1, ownerId: "u1", name: "Long Team Name", manager: "ada", avatar: null, wins: 3, losses: 1, ties: 0, pointsFor: 400, pointsAgainst: 350, value: 4000, valueRank: 2, powerRank: 3, rooms: [{ position: "RB", value: 4000, players: 4, avgAge: 24, rank: 2, leagueAvg: 3000 }], roster: ["1", "2", "3", "4"].map(player), players: ["1", "2", "3", "4"], starters: ["1"], taxi: ["3"], reserve: ["4"] };

describe("TeamDetail", () => {
  it("groups the roster correctly and preserves the username on player links", async () => {
    render(<TeamDetail team={team} leagueId="L1" leagueName="League" season="2026" teams={12} valuesReady username="ada" />);
    await userEvent.click(screen.getByRole("tab", { name: "Roster" }));
    for (const name of ["Starters", "Bench", "Taxi squad", "Injured reserve"]) expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Player 1" })).toHaveAttribute("href", "/L1/players/1?username=ada");
  });
  it("does not display room ranks or progress when values are unavailable", () => {
    render(<TeamDetail team={team} leagueId="L1" leagueName="League" season="2026" teams={12} valuesReady={false} />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText("#2 / 12")).not.toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });
});
