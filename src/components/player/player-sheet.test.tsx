import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerSheet } from "@/components/player/player-sheet";

const mocks = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn(), mobile: false }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => mocks.mobile }));
beforeEach(() => { vi.clearAllMocks(); mocks.mobile = false; });

describe("PlayerSheet", () => {
  it("opens on the right and dismisses intercepted navigation with browser back", async () => {
    render(<PlayerSheet title="Kyren Williams" intercepted><p>Player summary</p></PlayerSheet>);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "right");
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Kyren Williams");
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(mocks.back).toHaveBeenCalledOnce();
  });
  it("opens from the bottom on mobile and closes direct links to the players list", async () => {
    mocks.mobile = true;
    render(<PlayerSheet title="Kyren Williams" fallbackHref="/L1/players?username=ada"><p>Player summary</p></PlayerSheet>);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "bottom");
    await userEvent.keyboard("{Escape}");
    expect(mocks.replace).toHaveBeenCalledWith("/L1/players?username=ada");
  });
});
