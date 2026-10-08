import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlayerGameLog } from "@/components/player/player-game-log";
import { specimenProfile } from "@/lib/design-specimens";

describe("PlayerGameLog", () => {
  it("keeps zero scores distinct from missing data and shows available box score columns", () => {
    render(<PlayerGameLog profile={{ ...specimenProfile, weekly: [
      { week: 1, opponent: "TB", points: 0, pointsPpr: 0, stats: { car: 1, rush: 5 } },
      { week: 2, opponent: "NO", points: null, pointsPpr: null, stats: { car: null, rush: null } },
    ] }} />);
    expect(screen.getByRole("table")).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("columnheader", { name: "Rush yd" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Pass yd" })).not.toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getAllByRole("cell")[0]).toHaveTextContent("2");
    expect(within(rows[1]).getAllByRole("cell")[2]).toHaveTextContent("—");
    expect(within(rows[2]).getAllByRole("cell")[2]).toHaveTextContent("0.0");
  });
});
