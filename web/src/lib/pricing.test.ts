import { describe, expect, it } from "vitest";
import { calculatePrice, SIZES, type Format, type Size } from "./pricing";

// Every format the calculation supports, including "Cover page", which is no
// longer offered on the site but must keep pricing old orders correctly.
const ALL_FORMATS = ["Hard copy", "Digital copy", "Cover page"] as const;

// The calculator exactly as it runs on tailored-times.com (21 Sep 2026),
// kept here as the reference the port must match.
function livePrice(format: string, size: string, pagesIn: number, copies: number, frames: string, designer: string) {
  const envelopePrices: Record<string, number> = { Tabloid: 1.4, Broadsheet: 2.7 };
  const boxPrices: Record<string, number> = { Tabloid: 1.4, Broadsheet: 3.3 };
  const framePrices: Record<string, number> = { Tabloid: 7.5, Broadsheet: 15.5 };
  const designerFee = 20;
  const tab = (q: number) => (q <= 5 ? 1.08 : q <= 10 ? 1.0 : q <= 25 ? 0.88 : q <= 50 ? 0.79 : q <= 100 ? 0.75 : q <= 250 ? 0.7 : 0.65);
  const brd = (q: number) => (q <= 5 ? 3.25 : q <= 10 ? 3.15 : q <= 25 ? 3.05 : q <= 50 ? 2.6 : q <= 100 ? 2.85 : 2.6);

  const pages = format === "Cover page" ? 1 : pagesIn;
  if (format === "Digital copy") return 20 + (designer === "Yes" ? designerFee : 0);
  const totalQuantity = copies * pages;
  let price = size === "Tabloid" ? totalQuantity * tab(totalQuantity) : totalQuantity * brd(totalQuantity);
  if (frames === "Yes") {
    price += copies * framePrices[size];
    price += Math.ceil(copies / 4) * boxPrices[size];
  } else if (totalQuantity < 13) {
    price += envelopePrices[size];
  } else {
    price += Math.ceil(totalQuantity / 50) * boxPrices[size];
  }
  price *= 1.11;
  price += 5;
  const rounded = Math.ceil(price);
  if (rounded >= 11) price += 22 + Math.floor((rounded - 11) / 10) * 2;
  else if (rounded === 10) price *= 3.0;
  else if (rounded === 9) price *= 3.11;
  else if (rounded === 8) price *= 3.38;
  if (designer === "Yes") price += designerFee;
  return Math.round(price * 10) / 10;
}

describe("calculatePrice", () => {
  it("matches the live site for every format, size, page count, frame and designer option", () => {
    const copiesList = [1, 2, 3, 4, 5, 6, 10, 12, 13, 20, 25, 26, 50, 51, 100, 101, 250, 251, 500];
    let checked = 0;
    for (const format of ALL_FORMATS)
      for (const size of SIZES)
        for (const pages of [1, 4, 8, 12, 16, 20, 24])
          for (const copies of copiesList)
            for (const frames of [false, true])
              for (const designer of [false, true]) {
                const expected = livePrice(format, size, pages, copies, frames ? "Yes" : "No", designer ? "Yes" : "No");
                expect(calculatePrice({ format: format as Format, size: size as Size, pages, copies, frames, designer })).toBe(expected);
                checked++;
              }
    expect(checked).toBeGreaterThan(3000);
  });

  it("pins a few known prices", () => {
    expect(calculatePrice({ format: "Digital copy", size: "Tabloid", pages: 4, copies: 1, frames: false, designer: false })).toBe(20);
    expect(calculatePrice({ format: "Digital copy", size: "Tabloid", pages: 4, copies: 1, frames: false, designer: true })).toBe(40);
    // 1 tabloid cover: (1.08 + 1.4 envelope) × 1.11 + 5 = 7.75 → ceil 8 → × 3.38
    expect(calculatePrice({ format: "Cover page", size: "Tabloid", pages: 24, copies: 1, frames: false, designer: false })).toBe(26.2);
  });

  it("treats bad page and copy counts as 1", () => {
    const one = calculatePrice({ format: "Hard copy", size: "Tabloid", pages: 1, copies: 1, frames: false, designer: false });
    expect(calculatePrice({ format: "Hard copy", size: "Tabloid", pages: 0, copies: Number.NaN, frames: false, designer: false })).toBe(one);
  });
});
