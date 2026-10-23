// Colours customers type into "Color" fields: a hex code (#0D0C1D, 0d0c1d,
// #abc) or a common colour name. Anything else returns null, and the print
// keeps the template's own colour.

const NAMES: Record<string, string> = {
  black: "000000", white: "ffffff", grey: "808080", gray: "808080", silver: "c0c0c0",
  red: "e02424", maroon: "800000", burgundy: "800020", crimson: "dc143c", pink: "f4a6c0",
  "hot pink": "ff69b4", rose: "e8a0b4", blush: "deb3bd", coral: "ff7f50", salmon: "fa8072",
  orange: "f28c28", peach: "ffcba4", gold: "d4af37", yellow: "f5d033", beige: "e8dcc4",
  cream: "f3e9d2", brown: "8b5a2b", tan: "d2b48c", olive: "808000", green: "3a9a4a",
  "sage": "9caf88", mint: "98d8b8", "dark green": "1f5130", teal: "008080", turquoise: "40e0d0",
  "light blue": "9cc8e8", "sky blue": "87ceeb", blue: "2f6fd0", "royal blue": "4169e1",
  navy: "1f2a5a", "navy blue": "1f2a5a", purple: "7b3fa0", lavender: "b9a7d6", lilac: "c8a2c8",
  violet: "8f5fbf", plum: "8e4585", magenta: "c2307f", fuchsia: "d4359b",
};

export function parseColor(input: string): [number, number, number] | null {
  const s = input.trim().toLowerCase();
  const hex = NAMES[s] ?? s.replace(/^#/, "");
  const full = /^[0-9a-f]{3}$/.test(hex) ? [...hex].map((c) => c + c).join("") : hex;
  if (!/^[0-9a-f]{6}$/.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}
