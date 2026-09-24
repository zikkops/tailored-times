// Price calculator, ported 1:1 from the live WordPress template pages
// (21 Sep 2026). Owner decision: keep every number as it is. The numbers live
// in PricingConfig so admins can change them from the `pricing` table.
// Used by both the calculator UI and the server, which always recalculates.

// Formats customers can order. "Cover page" was dropped from the site (bug
// list R5) but stays in the Format type and the calculation, so old orders
// and any cover-page prices still work.
export const FORMATS = ["Hard copy", "Digital copy"] as const;
export const SIZES = ["Tabloid", "Broadsheet"] as const;

export type Format = (typeof FORMATS)[number] | "Cover page";
export type Size = (typeof SIZES)[number];

export type PriceTier = { maxQty: number | null; unit: number }; // null = no upper bound

export type PricingConfig = {
  digitalPrice: number;
  designerFee: number;
  pageOptions: number[];
  unitPrices: Record<Size, PriceTier[]>;
  framePrices: Record<Size, number>;
  boxPrices: Record<Size, number>;
  envelopePrices: Record<Size, number>;
  copiesPerFrameBox: number; // framed copies that fit in one box
  copiesPerBox: number; // unframed sheets that fit in one box
  envelopeMaxQty: number; // below this many sheets, one envelope instead of boxes
  markup: number;
  flatFee: number;
  // After markup, prices are bumped by these rules, keyed on ceil(price).
  smallOrderMultipliers: Record<number, number>;
  largeOrderBase: number; // applies when ceil(price) >= largeOrderFrom
  largeOrderFrom: number;
  largeOrderStepEvery: number;
  largeOrderStepAdd: number;
};

export const DEFAULT_PRICING: PricingConfig = {
  digitalPrice: 20,
  designerFee: 20,
  pageOptions: [1, 4, 8, 12, 16, 20, 24],
  unitPrices: {
    Tabloid: [
      { maxQty: 5, unit: 1.08 },
      { maxQty: 10, unit: 1.0 },
      { maxQty: 25, unit: 0.88 },
      { maxQty: 50, unit: 0.79 },
      { maxQty: 100, unit: 0.75 },
      { maxQty: 250, unit: 0.7 },
      { maxQty: null, unit: 0.65 },
    ],
    // 51–100 is higher than 26–50 on the live site. Kept on purpose (owner, 21 Sep 2026).
    Broadsheet: [
      { maxQty: 5, unit: 3.25 },
      { maxQty: 10, unit: 3.15 },
      { maxQty: 25, unit: 3.05 },
      { maxQty: 50, unit: 2.6 },
      { maxQty: 100, unit: 2.85 },
      { maxQty: null, unit: 2.6 },
    ],
  },
  framePrices: { Tabloid: 7.5, Broadsheet: 15.5 },
  boxPrices: { Tabloid: 1.4, Broadsheet: 3.3 },
  envelopePrices: { Tabloid: 1.4, Broadsheet: 2.7 },
  copiesPerFrameBox: 4,
  copiesPerBox: 50,
  envelopeMaxQty: 13,
  markup: 1.11,
  flatFee: 5,
  smallOrderMultipliers: { 8: 3.38, 9: 3.11, 10: 3.0 },
  largeOrderBase: 22,
  largeOrderFrom: 11,
  largeOrderStepEvery: 10,
  largeOrderStepAdd: 2,
};

export const DESIGNER_REQUIRED_FROM_PAGES = 8;

export type PriceInput = {
  format: Format;
  size: Size;
  pages: number;
  copies: number;
  frames: boolean;
  designer: boolean;
};

function unitPrice(tiers: PriceTier[], qty: number): number {
  const tier = tiers.find((t) => t.maxQty === null || qty <= t.maxQty);
  return (tier ?? tiers[tiers.length - 1]).unit;
}

export function calculatePrice(input: PriceInput, cfg: PricingConfig = DEFAULT_PRICING): number {
  if (input.format === "Digital copy") {
    return cfg.digitalPrice + (input.designer ? cfg.designerFee : 0);
  }

  const pages = input.format === "Cover page" ? 1 : Math.max(1, Math.floor(input.pages) || 1);
  const copies = Math.max(1, Math.floor(input.copies) || 1);
  const { size } = input;
  const qty = copies * pages;

  let price = qty * unitPrice(cfg.unitPrices[size], qty);

  if (input.frames) {
    price += copies * cfg.framePrices[size];
    price += Math.ceil(copies / cfg.copiesPerFrameBox) * cfg.boxPrices[size];
  } else if (qty < cfg.envelopeMaxQty) {
    price += cfg.envelopePrices[size];
  } else {
    price += Math.ceil(qty / cfg.copiesPerBox) * cfg.boxPrices[size];
  }

  price = price * cfg.markup + cfg.flatFee;

  const rounded = Math.ceil(price);
  if (rounded >= cfg.largeOrderFrom) {
    price +=
      cfg.largeOrderBase +
      Math.floor((rounded - cfg.largeOrderFrom) / cfg.largeOrderStepEvery) * cfg.largeOrderStepAdd;
  } else if (cfg.smallOrderMultipliers[rounded]) {
    price *= cfg.smallOrderMultipliers[rounded];
  }

  if (input.designer) price += cfg.designerFee;

  return Math.round(price * 10) / 10;
}
