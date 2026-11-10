import { describe, expect, it } from "vitest";
import { readJson, viewOf } from "@/lib/async-view";

describe("viewOf", () => {
  it("is idle without an input, whatever answer is held", () => {
    expect(viewOf(null, null)).toEqual({ status: "idle" });
    expect(viewOf(null, { key: "a", ok: true, value: 1 })).toEqual({ status: "idle" });
  });

  it("is pending until an answer for the current input arrives", () => {
    expect(viewOf("a", null)).toEqual({ status: "pending" });
    expect(viewOf("b", { key: "a", ok: true, value: 1 })).toEqual({ status: "pending" });
  });

  it("shows the answer only for the input it answers", () => {
    expect(viewOf("a", { key: "a", ok: true, value: 1 })).toEqual({ status: "done", value: 1 });
    expect(viewOf("a", { key: "a", ok: false, error: "nope" })).toEqual({ status: "failed", error: "nope" });
  });
});

describe("readJson", () => {
  it("returns the parsed object", async () => {
    expect(await readJson(new Response('{"error":"x"}'))).toEqual({ error: "x" });
  });

  it("returns an empty object for a non-JSON or non-object body", async () => {
    expect(await readJson(new Response("<html>Bad gateway</html>", { status: 502 }))).toEqual({});
    expect(await readJson(new Response("null"))).toEqual({});
  });
});
