import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TradeCalculator } from "@/components/trade-calculator";
import type { TradeLabData } from "@/lib/trade-lab";

// No teams and no connected roster: both sides start in hypothetical mode, which searches the server.
const data: TradeLabData = {
  league: { id: "L1", name: "Test League", season: "2026", superflex: false, isDynasty: false, basis: "redraft" },
  teams: [],
  myRosterId: null,
  picks: [],
  valuesReady: true,
  picksReady: true,
};

const player = (id: string, name: string) => ({ player: { id, name, position: "QB", team: "BUF", age: 30 }, value: 20, trend7d: 0 });

function stubFetch(trade: () => Response) {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.startsWith("/api/leagues/")) {
      const q = new URL(url, "http://x").searchParams.get("q") ?? "";
      return new Response(JSON.stringify({ players: [player(`p-${q}`, `Player ${q}`)] }));
    }
    return trade();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("TradeCalculator", () => {
  it("keeps search results when the query only gains whitespace", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(() => new Response("{}"));
    render(<TradeCalculator data={data} />);
    const input = screen.getByLabelText("Add an asset to You receive");

    await user.type(input, "josh");
    expect(await screen.findByText("Player josh")).toBeInTheDocument();
    await user.type(input, " ");

    expect(screen.getByText("Player josh")).toBeInTheDocument();
    expect(screen.queryByText("Searching...")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows a readable error when the comparison endpoint returns a non-JSON page", async () => {
    const user = userEvent.setup();
    stubFetch(() => new Response("<html>Bad gateway</html>", { status: 502 }));
    render(<TradeCalculator data={data} />);

    await user.type(screen.getByLabelText("Add an asset to You receive"), "allen");
    await user.click(await screen.findByRole("button", { name: /Player allen/ }));
    await user.type(screen.getByLabelText("Add an asset to You send"), "mahomes");
    await user.click(await screen.findByRole("button", { name: /Player mahomes/ }));

    const alert = await screen.findByRole("alert", undefined, { timeout: 2000 });
    expect(within(alert).getByText("The trade could not be calculated.")).toBeInTheDocument();
  });
});
