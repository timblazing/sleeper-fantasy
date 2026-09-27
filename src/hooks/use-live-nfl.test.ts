import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLiveNfl } from "./use-live-nfl";

const fetchMock = vi.fn();
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const flush = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
};

describe("live NFL polling", () => {
  it("refreshes every 30 seconds and retains last scores on failure", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ score: 7 }) })
      .mockResolvedValue({ ok: false });
    const { result, unmount } = renderHook(() =>
      useLiveNfl<{ score: number }>("/api/scoreboard"),
    );
    await flush();
    expect(result.current.data).toEqual({ score: 7 });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual({ score: 7 });
    expect(result.current.error).toContain("Unable to update");
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("pauses while hidden and immediately refreshes when visible", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ score: 7 }) });
    const { unmount } = renderHook(() => useLiveNfl("/api/scoreboard"));
    await flush();
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    unmount();
  });
  it("aborts pending requests when the game details close", async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const { unmount } = renderHook(() => useLiveNfl("/api/scoreboard/123"));
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
