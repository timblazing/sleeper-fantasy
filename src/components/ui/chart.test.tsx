import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChartContainer, ChartTooltipContent, useChartAnimation } from "./chart";

afterEach(() => vi.unstubAllGlobals());

describe("chart presentation", () => {
  it("updates animation when the operating system motion preference changes", () => {
    let reduced = true;
    let notify: (() => void) | undefined;
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      get matches() { return reduced; },
      addEventListener: (_type: string, listener: () => void) => { notify = listener; },
      removeEventListener: vi.fn(),
    })));
    function Motion() { return <span>{useChartAnimation() ? "Animated" : "Still"}</span>; }
    render(<Motion />);
    expect(screen.getByText("Still")).toBeInTheDocument();
    act(() => { reduced = false; notify?.(); });
    expect(screen.getByText("Animated")).toBeInTheDocument();
    act(() => { reduced = true; notify?.(); });
    expect(screen.getByText("Still")).toBeInTheDocument();
  });

  it("keeps a zero category label and measured zero in its tooltip", () => {
    render(
      <ChartContainer config={{ points: { label: "Points" } }} nativeResponsive>
        <ChartTooltipContent active label={0} payload={[{ dataKey: "points", name: "points", value: 0 }]} />
      </ChartContainer>,
    );
    expect(screen.getAllByText("0")).toHaveLength(2);
    expect(screen.getByText("Points")).toBeInTheDocument();
  });
});
