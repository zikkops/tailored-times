// Print layouts: where each numbered field goes on a template's pages, so an
// order can be turned into the PDF the printing house gets.
//
// Proof of concept (22 Oct 2026): Birthday 1, cover page. The background is
// the template's own sample page; every slot first covers the sample content
// with the paper colour (`mask`), then draws the customer's text or photo.
// For real print quality the designer should export each page at 300 dpi
// without the variable content, with the template's real fonts.
//
// Boxes are [x, y, width, height] in the background image's pixels.

export type Box = [number, number, number, number];

export type FontName = "serif-display" | "serif-caps" | "hand" | "marker";

export type Slot =
  | {
      field: string; // form field key, e.g. "n3_title"
      kind: "text";
      box: Box;
      mask?: Box;
      font: FontName;
      size: number; // font size in background pixels
      align?: "left" | "center" | "right";
      upper?: boolean;
      lineHeight?: number; // multiple of the size; set for multi-line text
      color?: string;
    }
  | { field: string; kind: "photo"; box: Box }
  // Repaints the coloured part of a region (e.g. a brush stroke) in the
  // customer's colour, leaving black ink and the paper alone.
  | { field: string; kind: "tint"; box: Box };

export type PrintPage = { background: string; slots: Slot[] };

export type PrintLayout = {
  width: number; // background image size, px
  height: number;
  paper: [number, number, number]; // paper colour, for masks
  pages: PrintPage[];
};

export const PRINT_LAYOUTS: Record<string, PrintLayout> = {
  birthday: {
    width: 1600,
    height: 2236,
    paper: [245, 244, 240],
    pages: [
      {
        background: "public/templates/birthday/1.jpg",
        slots: [
          { field: "n1_edition", kind: "text", box: [95, 80, 330, 46], mask: [85, 74, 340, 56], font: "serif-display", size: 34 },
          { field: "n2_location", kind: "text", box: [1180, 80, 330, 46], mask: [1270, 74, 250, 56], font: "serif-display", size: 34, align: "right" },
          { field: "n3_title", kind: "text", box: [300, 476, 1000, 72], mask: [440, 470, 720, 82], font: "serif-caps", size: 70, align: "center", upper: true },
          { field: "n4_person", kind: "text", box: [66, 893, 500, 80], mask: [195, 890, 250, 84], font: "marker", size: 70, align: "center", upper: true },
          { field: "n5_color", kind: "tint", box: [140, 996, 345, 94] },
          { field: "n6_photo", kind: "photo", box: [643, 623, 857, 848] },
          { field: "n7_title", kind: "text", box: [213, 1536, 375, 74], mask: [205, 1532, 385, 82], font: "serif-display", size: 62 },
          { field: "n8_text", kind: "text", box: [132, 1690, 1320, 430], mask: [118, 1680, 1350, 452], font: "hand", size: 37, lineHeight: 1.62 },
        ],
      },
    ],
  },
};

// Paper sizes from the order form (portrait), in millimetres.
export const PAPER_MM = {
  Tabloid: [240, 330],
  Broadsheet: [357, 500],
} as const;

export const hasPrintLayout = (slug: string) => slug in PRINT_LAYOUTS;
