import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InjuryToolbar } from "@/components/injury-toolbar";
import type { InjuryQuery } from "@/lib/injury-query";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
const query: InjuryQuery = { position: "all", search: "", sort: "severity", severities: [], startersOnly: false, username: "tim" };

describe("InjuryToolbar URL filters", () => {
  it("preserves active severity, team and identity when changing position", () => {
    render(<InjuryToolbar leagueId="L1" query={{ ...query, severities: ["risk"], team: 4 }} />);
    expect(screen.getByRole("button", { name: "RB" })).toHaveAttribute("href", "/L1/players?position=RB&status=risk&team=4&username=tim&view=injuries");
  });
  it("offers a full reset for severity-only filters, preserving username", () => {
    render(<InjuryToolbar leagueId="L1" query={{ ...query, severities: ["out"], startersOnly: true }} />);
    expect(screen.getByRole("button", { name: "Clear filters" })).toHaveAttribute("href", "/L1/players?username=tim&view=injuries");
  });
});
