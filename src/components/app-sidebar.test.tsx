import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { LeagueChrome } from "@/lib/league-chrome";

// The sidebar reads the app-router hooks; jsdom has no router.
const searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => searchParams,
  useSelectedLayoutSegment: () => null,
}));

// The sidebar primitives call useIsMobile, which calls window.matchMedia.
beforeAll(() => {
  window.matchMedia = ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false } as Response)));
});

const league = (isDynasty: boolean): LeagueChrome => ({ id: "123", name: "Test League", season: "2026", type: isDynasty ? "Dynasty" : "Redraft", isDynasty, basis: isDynasty ? "dynasty" : "redraft", isSuperflex: true, avatar: null, matchupWeek: 4 });

const hrefs = (container: HTMLElement) => [...container.querySelectorAll("a")].map((anchor) => anchor.getAttribute("href"));

function renderSidebar(chrome: LeagueChrome) {
  return render(<SidebarProvider><AppSidebar league={chrome} /></SidebarProvider>);
}

describe("AppSidebar", () => {
  it("renders every tool link for a dynasty league", () => {
    const { container } = renderSidebar(league(true));
    const rendered = hrefs(container);
    expect(rendered).toEqual(expect.arrayContaining(["/123/trade", "/123/draft-insights"]));
    expect(screen.queryByText("Injury Report")).not.toBeInTheDocument();
    expect(screen.queryByText("Dynasty tools unavailable")).not.toBeInTheDocument();
  });

  it("renders the GitHub project link in the secondary footer navigation", () => {
    renderSidebar(league(true));
    const github = screen.getByRole("link", { name: "GitHub" });
    expect(github).toHaveAttribute("href", "https://github.com/timblazing/sleeper-fantasy");
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noreferrer");
    expect(screen.queryByText("Links")).not.toBeInTheDocument();
  });

  it("does not render the removed Insights page", () => {
    const { container } = renderSidebar(league(true));
    const rendered = hrefs(container);
    expect(rendered).not.toContain("/123/insights");
    expect(screen.queryByText("Insights")).not.toBeInTheDocument();
  });

  // The Trade Calculator used to be locked behind a dynasty league. It now grades a redraft deal
  // on the starting points each side gains, so nothing in Tools is withheld by format any more.
  it("keeps the trade calculator in Tools for a redraft league, unlocked", () => {
    const { container } = renderSidebar(league(false));
    expect(hrefs(container)).toContain("/123/trade");
    expect(screen.getByText("Trade Calculator")).toBeInTheDocument();
    expect(screen.queryByText("Dynasty tools unavailable")).not.toBeInTheDocument();
  });

  it("offers Rankings and Injuries as separate Players links for every league format", () => {
    for (const isDynasty of [true, false]) {
      const { container, unmount } = renderSidebar(league(isDynasty));
      const rendered = hrefs(container);
      expect(rendered).toContain("/123/players");
      expect(rendered).toContain("/123/injuries");
      expect(rendered.indexOf("/123/injuries")).toBe(rendered.indexOf("/123/players") + 1);
      expect(screen.getByText("Rankings")).toBeInTheDocument();
      expect(screen.getByText("Injuries")).toBeInTheDocument();
      unmount();
    }
  });

  it("keeps Resources in the footer links, below GitHub, for every league format", () => {
    for (const isDynasty of [true, false]) {
      const { container, unmount } = renderSidebar(league(isDynasty));
      expect(hrefs(container)).toContain("/123/resources");
      expect(screen.getByText("Resources")).toBeInTheDocument();
      const rendered = hrefs(container);
      expect(rendered.indexOf("/123/resources")).toBe(rendered.indexOf("https://github.com/timblazing/sleeper-fantasy") + 1);
      unmount();
    }
  });

  it("groups navigation into League, Players and Tools, in order", () => {
    const { container } = renderSidebar(league(true));
    const rendered = hrefs(container).filter((href): href is string => href !== null && href.startsWith("/123"));
    expect(rendered.slice(0, 11)).toEqual([
      "/123", "/123/matchups/4", "/123/standings", "/123/teams", "/123/activity", "/123/history",
      "/123/players", "/123/injuries",
      "/123/trade", "/123/scouting-report", "/123/draft-insights",
    ]);
    for (const label of ["League", "Players", "Tools"]) expect(screen.getByText(label, { exact: true })).toBeInTheDocument();
  });

  it("shows the current matchup week as a badge on Matchups", () => {
    renderSidebar(league(true));
    expect(screen.getByText("WK 4")).toBeInTheDocument();
  });

  it("no longer offers the removed Weekly Report link", () => {
    const { container } = renderSidebar(league(true));
    expect(hrefs(container)).not.toContain("/123/weekly-report");
    expect(screen.queryByText("Weekly Report")).not.toBeInTheDocument();
  });

  it("does not offer the removed analytics links", () => {
    const { container } = renderSidebar(league(true));
    const rendered = hrefs(container);
    expect(rendered).not.toContain("/123/power-rankings");
    expect(rendered).not.toContain("/123/playoffs");
    expect(rendered).not.toContain("/123/draft");
    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();
    expect(screen.queryByText("Power Rankings")).not.toBeInTheDocument();
    expect(screen.queryByText("Playoffs")).not.toBeInTheDocument();
    expect(screen.queryByText("League History")).not.toBeInTheDocument();
  });

  it("labels the draft analytics entry Draft Insights", () => {
    const { container } = renderSidebar(league(true));
    expect(hrefs(container)).toContain("/123/draft-insights");
    expect(screen.getByText("Draft Insights")).toBeInTheDocument();
  });

  it("renders Scouting in Tools for every league format", () => {
    for (const isDynasty of [true, false]) {
      const { container, unmount } = renderSidebar(league(isDynasty));
      expect(hrefs(container)).toContain("/123/scouting-report");
      expect(screen.getByText("Scouting Report")).toBeInTheDocument();
      unmount();
    }
  });

  it("places Draft Insights directly under Scouting", () => {
    const { container } = renderSidebar(league(true));
    const rendered = hrefs(container);
    expect(rendered.indexOf("/123/scouting-report")).toBe(rendered.indexOf("/123/trade") + 1);
    expect(rendered.indexOf("/123/draft-insights")).toBe(rendered.indexOf("/123/scouting-report") + 1);
  });

  it("does not render the removed Stats link", () => {
    const { container } = renderSidebar(league(true));
    const rendered = hrefs(container);
    expect(rendered).not.toContain("/123/stats");
    expect(screen.queryByText("Stats")).not.toBeInTheDocument();
  });

  it("no longer offers the removed League Hub link", () => {
    const { container } = renderSidebar(league(true));
    expect(hrefs(container)).not.toContain("/123/hub");
    expect(screen.queryByText("League Hub")).not.toBeInTheDocument();
  });

  it("preserves the username query on every sidebar link", () => {
    searchParams.set("username", "tim blazing");
    try {
      const { container } = renderSidebar(league(true));
      const rendered = hrefs(container).filter((href): href is string => href !== null && href.startsWith("/123"));
      expect(rendered.length).toBeGreaterThan(0);
      for (const href of rendered) expect(href).toContain("?username=tim%20blazing");
      expect(rendered).toContain("/123/draft-insights?username=tim%20blazing");
      expect(rendered).toContain("/123/matchups/4?username=tim%20blazing");
    } finally {
      searchParams.delete("username");
    }
  });
});
