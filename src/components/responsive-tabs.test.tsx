import { useState } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ResponsiveTabs } from "@/components/responsive-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";

const items = [{ value: "overview", label: "Overview" }, { value: "history", label: "History" }];

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});

function Example() {
  const [value, setValue] = useState("overview");
  return <Tabs value={value} onValueChange={setValue}>
    <ResponsiveTabs items={items} value={value} onValueChange={setValue} label="Player views" />
    <TabsContent value="overview">Overview content</TabsContent>
    <TabsContent value="history">History content</TabsContent>
  </Tabs>;
}

describe("ResponsiveTabs", () => {
  it("changes the active panel through keyboard tabs and keeps the mobile selector in sync", async () => {
    const user = userEvent.setup();
    render(<Example />);
    act(() => screen.getByRole("tab", { name: "History" }).focus());
    await user.keyboard("{Enter}");
    expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("History content");
    expect(screen.getByRole("combobox", { name: "Player views" })).toHaveTextContent("History");
  });

  it("changes the same panel from the mobile selector", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Example />);
    await user.click(screen.getByRole("combobox", { name: "Player views" }));
    await user.click(await screen.findByRole("option", { name: "History" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("History content");
    expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps predicate filters as pressed buttons rather than tab panels", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ResponsiveTabs items={items} value="overview" onValueChange={onChange} label="Manager filters" mode="filter" />);
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "History" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("history");
  });
});
