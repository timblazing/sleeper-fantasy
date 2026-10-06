import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { DraftWorkspace } from "@/components/draft-workspace";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { DraftGradeData, DraftPickGrade } from "@/lib/draft-grades";

beforeAll(() => {
  window.matchMedia = ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});
const pick: DraftPickGrade = { id: "pick", pick: "1.01", pickNo: 1, round: 1, player: "Test player", playerId: "1", position: "QB", team: "BUF", value: 120, slotValue: 100, surplus: 20, grade: "A", acquiredFrom: null };
const data: DraftGradeData = {
  drafts: [{ id: "draft", label: "2026 rookie", season: "2026" }], selectedDraftId: "draft", selectedLabel: "2026 rookie", selectedSeason: "2026", rounds: 1, teams: 1, superflex: true, basis: "dynasty", curveBacked: true,
  managers: [{ rosterId: 1, ownerId: "owner", manager: "Test manager", teamName: "Test team", avatar: null, grade: "A", hitRate: 100, surplus: 20, surplusPerPick: 20, spent: 100, earned: 120, best: pick, worst: pick, picks: [pick] }],
  allPicks: [{ ...pick, rosterId: 1, manager: "Test manager" }], steals: [], reaches: [], byPosition: [], byRound: [], career: [], classes: [], attribution: null,
};

function setup() { render(<TooltipProvider><DraftWorkspace data={data} basePath="/league/draft" /></TooltipProvider>); }

describe("Draft keyboard actions", () => {
  it("opens manager grades with Enter from the leaderboard primary cell", async () => {
    const user = userEvent.setup();
    setup();
    act(() => screen.getByRole("button", { name: "View draft grades for Test team" }).focus());
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("dialog")).toHaveAccessibleName(/Test team/);
    expect(screen.getByText("Hit rate")).toBeInTheDocument();
  });

  it("opens the drafting manager with Space from a draft result primary cell", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("tab", { name: "Draft results" }));
    act(() => screen.getByRole("button", { name: "View draft grades for Test player, picked by Test manager" }).focus());
    await user.keyboard(" ");
    expect(await screen.findByRole("dialog")).toHaveAccessibleName(/Test team/);
  });
});
