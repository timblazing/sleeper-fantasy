import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityFeed, parseActivityFilter } from "@/components/activity-feed";
import type { ActivityItem } from "@/lib/types";

const item = (id: string, kind: ActivityItem["kind"]): ActivityItem => ({ id, type: "Move", detail: `detail ${id}`, time: "1h ago", kind, team: "Team", teams: [], adds: [], drops: [], bid: null });
const items = [item("a", "trade"), item("b", "add"), item("c", "add"), item("d", "drop")];

describe("parseActivityFilter", () => {
  it("accepts known types and falls back to all", () => {
    expect(parseActivityFilter("trade")).toBe("trade");
    expect(parseActivityFilter(["drop", "add"])).toBe("drop");
    expect(parseActivityFilter("nope")).toBe("all");
    expect(parseActivityFilter(undefined)).toBe("all");
  });
});

describe("ActivityFeed", () => {
  it("links each filter in the URL, keeping the username", () => {
    render(<ActivityFeed filter="all" items={items} leagueId="L1" username="clay" />);
    expect(screen.getByRole("button", { name: /Trades/ })).toHaveAttribute("href", "/L1/activity?type=trade&username=clay");
    expect(screen.getByRole("button", { name: /All/ })).toHaveAttribute("href", "/L1/activity?username=clay");
  });

  it("shows only the selected kind with counts", () => {
    render(<ActivityFeed filter="add" items={items} leagueId="L1" />);
    expect(screen.getByRole("button", { name: /Adds/ })).toHaveTextContent("2");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("explains an empty filter", () => {
    render(<ActivityFeed filter="trade" items={[item("b", "add")]} leagueId="L1" />);
    expect(screen.getByText("Nothing in this view")).toBeInTheDocument();
  });
});
