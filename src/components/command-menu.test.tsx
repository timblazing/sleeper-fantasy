import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandMenu } from "@/components/command-menu";
import type { LeagueChrome } from "@/lib/league-chrome";

const push = vi.fn();
const setTheme = vi.fn();
const searchParams = new URLSearchParams("username=clay");
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => searchParams }));
vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme }) }));

const league: LeagueChrome = { id: "123", name: "Test League", season: "2026", type: "Redraft", isDynasty: false, basis: "redraft", isSuperflex: false, avatar: null, matchupWeek: 4 };

beforeAll(() => {
  // cmdk measures and scrolls items; jsdom implements neither.
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Element.prototype.scrollIntoView = () => {};
});

beforeEach(() => {
  push.mockClear();
  setTheme.mockClear();
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    const body = url.includes("/teams") ? { teams: [{ rosterId: 7, name: "Gridiron Ghosts", manager: "sam" }] }
      : url.includes("/players") ? { players: [{ player: { id: "4046", name: "Patrick Mahomes", position: "QB", team: "KC" } }] }
      : { error: "no" };
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);
  }));
});

describe("CommandMenu", () => {
  it("opens on Ctrl+K and navigates to a page, keeping the username", async () => {
    render(<CommandMenu league={league} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Standings"));
    expect(push).toHaveBeenCalledWith("/123/standings?username=clay");
  });

  it("lazy-loads teams on open and navigates to one", async () => {
    render(<CommandMenu league={league} />);
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    fireEvent.click(await screen.findByText("Gridiron Ghosts"));
    expect(push).toHaveBeenCalledWith("/123/teams/7?username=clay");
  });

  it("searches players and sets the theme", async () => {
    render(<CommandMenu league={league} />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.change(await screen.findByPlaceholderText(/Search pages/), { target: { value: "mahomes" } });
    fireEvent.click(await screen.findByText("Patrick Mahomes", undefined, { timeout: 2000 }));
    expect(push).toHaveBeenCalledWith("/123/players/4046?username=clay");

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.click(await screen.findByText("Dark"));
    await waitFor(() => expect(setTheme).toHaveBeenCalledWith("dark"));
  });
});
