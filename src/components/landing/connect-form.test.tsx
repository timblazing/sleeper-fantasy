import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectForm } from "@/components/landing/connect-form";

const mocks = vi.hoisted(() => ({ rememberAccount: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/account-storage", () => ({ rememberAccount: mocks.rememberAccount }));

const league = (id: string, name: string) => ({ id, name, season: "2026", status: "in_season", type: "Redraft", isDynasty: false, avatar: null });
const respond = (body: unknown, ok = true) => vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => body, ok }));

describe("ConnectForm", () => {
  beforeEach(() => {
    mocks.rememberAccount.mockReset();
    mocks.push.mockReset();
    vi.restoreAllMocks();
  });

  it("goes straight to the only league on Enter", async () => {
    const user = userEvent.setup();
    respond({ leagues: [league("L1", "Solo")], username: "TimBlazing" });
    render(<ConnectForm />);

    await user.type(screen.getByLabelText("Sleeper username"), "TimBlazing{Enter}");

    expect(fetch).toHaveBeenCalledWith("/api/leagues?username=TimBlazing");
    expect(mocks.rememberAccount).toHaveBeenCalledWith({ leagueId: "L1", username: "TimBlazing" });
    expect(mocks.push).toHaveBeenCalledWith("/L1?username=TimBlazing");
  });

  it("shows a picker for several leagues and remembers the chosen one", async () => {
    const user = userEvent.setup();
    respond({ leagues: [league("L1", "Alpha"), league("L2", "Beta")], username: "TimBlazing" });
    render(<ConnectForm />);

    await user.type(screen.getByLabelText("Sleeper username"), "TimBlazing{Enter}");
    expect(mocks.push).not.toHaveBeenCalled();
    await user.click(await screen.findByRole("button", { name: /Beta/ }));

    expect(mocks.rememberAccount).toHaveBeenCalledWith({ leagueId: "L2", username: "TimBlazing" });
    expect(mocks.push).toHaveBeenCalledWith("/L2?username=TimBlazing");
  });

  it("opens the preselected league when the account has it", async () => {
    const user = userEvent.setup();
    respond({ leagues: [league("L1", "Alpha"), league("L2", "Beta")], username: "TimBlazing" });
    render(<ConnectForm preselectLeagueId="L2" />);

    await user.type(screen.getByLabelText("Sleeper username"), "TimBlazing{Enter}");

    expect(mocks.push).toHaveBeenCalledWith("/L2?username=TimBlazing");
  });

  it("shows the lookup error inline", async () => {
    const user = userEvent.setup();
    respond({ error: "Sleeper user not found." }, false);
    render(<ConnectForm />);

    await user.type(screen.getByLabelText("Sleeper username"), "nobody{Enter}");

    expect(await screen.findByText("Sleeper user not found.")).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
