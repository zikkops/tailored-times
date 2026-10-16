import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { whishAmount, readEnvelope, WhishError } = await import("./whish");

describe("Whish amounts", () => {
  it("sends USD as a string with two decimals", () => {
    expect(whishAmount(33.3)).toBe("33.30");
    expect(whishAmount(82)).toBe("82.00");
    expect(whishAmount(140.95)).toBe("140.95");
  });

  it("refuses anything under their 1.00 minimum", () => {
    expect(() => whishAmount(0)).toThrow(WhishError);
    expect(() => whishAmount(0.5)).toThrow(WhishError);
    expect(() => whishAmount(Number.NaN)).toThrow(WhishError);
  });
});

describe("Whish replies", () => {
  it("reads a success", () => {
    expect(readEnvelope({ status: true, code: null })).toMatchObject({ ok: true, pending: false });
  });

  // The one that matters: their 500 means "not settled yet", and reading it as
  // a failure would write off a payment the customer may still be making.
  it("treats status false with code 500 as pending, not failed", () => {
    const read = readEnvelope({ status: false, code: 500, dialog: { message: "unknown" } });
    expect(read.ok).toBe(false);
    expect(read.pending).toBe(true);
  });

  it("reads a real failure, and keeps their reason", () => {
    const read = readEnvelope({ status: false, code: 1001, dialog: { message: "Insufficient balance" } });
    expect(read).toMatchObject({ ok: false, pending: false, message: "Insufficient balance" });
  });

  it("does not call a reply successful when it carries a code", () => {
    expect(readEnvelope({ status: true, code: 400 }).ok).toBe(false);
  });
});
