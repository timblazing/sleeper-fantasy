import { describe, expect, it } from "vitest";
import { getClientAddress } from "@/lib/client-address";

describe("getClientAddress", () => {
  it("ignores a client-supplied cf-connecting-ip", () => {
    expect(getClientAddress(new Headers({ "cf-connecting-ip": "198.51.100.4", "x-forwarded-for": "203.0.113.1" }))).toBe("203.0.113.1");
  });

  it("reads a single x-forwarded-for value", () => {
    expect(getClientAddress(new Headers({ "x-forwarded-for": "203.0.113.1" }))).toBe("203.0.113.1");
  });

  it("takes the first valid address from a forwarded list", () => {
    expect(getClientAddress(new Headers({ "x-forwarded-for": "garbage, 203.0.113.2, 203.0.113.3" }))).toBe("203.0.113.2");
  });

  it("falls through a malformed x-forwarded-for to x-real-ip", () => {
    expect(getClientAddress(new Headers({ "x-forwarded-for": "not-an-ip", "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("accepts IPv6 addresses", () => {
    expect(getClientAddress(new Headers({ "x-forwarded-for": "2001:db8::1" }))).toBe("2001:db8::1");
  });

  it("groups callers with no usable address into one bucket", () => {
    expect(getClientAddress(new Headers())).toBe("anonymous");
    expect(getClientAddress(new Headers({ "x-forwarded-for": "spoofed" }))).toBe("anonymous");
  });
});
