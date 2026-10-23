import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import sharp from "sharp";
import { parseColor } from "./colors";
import { PAPER_MM, PRINT_LAYOUTS, type Box, type FontName, type PrintLayout, type Slot } from "./layouts";

// Turns an order into the PDF for the printing house: the template's pages
// with the customer's text and photos in place. Anything missing or too long
// is marked in red on the page and listed in `warnings`, so the team checks
// the proof before sending it.

export type PrintField = { label: string; value: string };
export type PrintInput = {
  template: string; // slug
  size: "Tabloid" | "Broadsheet";
  fields: Record<string, PrintField>; // by field key; photos have an empty value
  photos: Record<string, Buffer>; // by field key
};
export type PrintResult = { pdf: Uint8Array; warnings: string[] };

const FONT_FILES: Record<FontName, string> = {
  "serif-display": "DMSerifDisplay-Regular.ttf",
  "serif-caps": "CormorantSC-SemiBold.ttf",
  hand: "Delius-Regular.ttf",
  marker: "PermanentMarker-Regular.ttf",
};

const PT_PER_MM = 72 / 25.4;
const PHOTO_DPI = 300;
const RED = rgb(0.85, 0.1, 0.1);

export async function renderPrintPdf(input: PrintInput): Promise<PrintResult> {
  const layout = PRINT_LAYOUTS[input.template];
  if (!layout) throw new Error(`No print layout for "${input.template}" yet.`);
  const warnings: string[] = [];

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Tailored Times print file`);
  const fonts = new Map<FontName, PDFFont>();
  const font = async (name: FontName) => {
    if (!fonts.has(name)) {
      const bytes = await readFile(path.join(process.cwd(), "src/print/fonts", FONT_FILES[name]));
      // Whole fonts: pdf-lib's subsetting drops letters from some of them.
      fonts.set(name, await doc.embedFont(bytes));
    }
    return fonts.get(name)!;
  };

  const [wMm, hMm] = PAPER_MM[input.size];
  const W = wMm * PT_PER_MM;
  const H = hMm * PT_PER_MM;
  // The artwork is fitted inside the page and centred; the rest is paper.
  const s = Math.min(W / layout.width, H / layout.height);
  const ox = (W - layout.width * s) / 2;
  const oy = (H - layout.height * s) / 2;
  const rect = ([x, y, w, h]: Box) => ({ x: ox + x * s, y: H - oy - (y + h) * s, width: w * s, height: h * s });
  const [pr, pg, pb] = layout.paper;

  for (const pageLayout of layout.pages) {
    const page = doc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(pr / 255, pg / 255, pb / 255) });

    const background = await paintBackground(layout, pageLayout.background, pageLayout.slots, input, warnings);
    page.drawImage(await doc.embedJpg(background), rect([0, 0, layout.width, layout.height]));

    for (const slot of pageLayout.slots) {
      const field = input.fields[slot.field];
      const label = field?.label ?? slot.field;
      if (slot.kind === "photo") {
        const photo = input.photos[slot.field];
        const r = rect(slot.box);
        const fitted = photo && (await fitPhoto(photo, slot.box, s).catch(() => null));
        if (fitted) {
          page.drawImage(await doc.embedJpg(fitted), r);
        } else {
          warnings.push(photo ? `${label}: this photo couldn't be read (HEIC photos need converting first).` : `${label}: no photo.`);
          page.drawRectangle({ ...r, color: rgb(0.88, 0.88, 0.88) });
          placeholder(page, await font("hand"), `[${label}]`, r, 37 * s);
        }
      } else if (slot.kind === "text") {
        const f = await font(slot.font);
        const value = field?.value.trim() ?? "";
        if (!value) {
          warnings.push(`${label}: empty.`);
          placeholder(page, f, `[${label}]`, rect(slot.box), slot.size * s * 0.6, slot.align);
          continue;
        }
        drawText(page, f, slot, value, s, rect(slot.box), label, warnings);
      }
    }
  }

  return { pdf: await doc.save(), warnings };
}

// The page background with the sample content covered in the paper colour
// and tinted areas repainted, as a JPEG.
async function paintBackground(layout: PrintLayout, file: string, slots: Slot[], input: PrintInput, warnings: string[]) {
  const { data, info } = await sharp(path.join(process.cwd(), file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (x: number, y: number) => (y * info.width + x) * 3;
  const clip = ([x, y, w, h]: Box) => [Math.max(0, x), Math.max(0, y), Math.min(info.width, x + w), Math.min(info.height, y + h)];
  const paper = layout.paper;

  for (const slot of slots) {
    if (slot.kind === "tint") {
      const value = input.fields[slot.field]?.value ?? "";
      if (!value.trim()) continue; // keep the template's colour
      const target = parseColor(value);
      if (!target) {
        warnings.push(`${input.fields[slot.field]?.label ?? slot.field}: "${value}" isn't a colour we recognise; the template's colour is kept.`);
        continue;
      }
      tint(data, at, clip(slot.box), paper, target);
    } else if (slot.kind === "text") {
      const [x0, y0, x1, y1] = clip(slot.mask ?? slot.box);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) data.set(paper, at(x, y));
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).jpeg({ quality: 92 }).toBuffer();
}

// Repaints the coloured pixels in a region: how far each one is from the
// paper, relative to the region's main colour, sets how much of the new
// colour it gets. Black ink (dark and grey) is left as it is.
function tint(data: Buffer, at: (x: number, y: number) => number, [x0, y0, x1, y1]: number[], paper: number[], target: number[]) {
  const coloured = (i: number) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    return Math.max(r, g, b) - Math.min(r, g, b) > 30 && Math.max(r, g, b) > 90;
  };
  let n = 0;
  const sum = [0, 0, 0];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = at(x, y);
    if (coloured(i)) { n++; for (let c = 0; c < 3; c++) sum[c] += data[i + c]; }
  }
  if (!n) return;
  const main = sum.map((v) => v / n);
  const reach = Math.hypot(...main.map((v, c) => v - paper[c]));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = at(x, y);
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) < 12) continue; // paper or black ink
    const a = Math.min(1, Math.hypot(r - paper[0], g - paper[1], b - paper[2]) / reach);
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(paper[c] + (target[c] - paper[c]) * a);
  }
}

// The photo cropped to fill its frame, at print resolution.
async function fitPhoto(photo: Buffer, [, , w, h]: Box, scale: number) {
  const inches = (px: number) => (px * scale) / 72;
  return sharp(photo)
    .rotate() // follow the camera's orientation
    .resize(Math.round(inches(w) * PHOTO_DPI), Math.round(inches(h) * PHOTO_DPI), { fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: 90 })
    .toBuffer();
}

// Characters the font can't draw (emoji, other scripts) are dropped, with a warning.
function drawable(f: PDFFont, text: string, label: string, warnings: string[]) {
  const set = new Set(f.getCharacterSet());
  let dropped = false;
  const out = [...text].filter((ch) => {
    const ok = ch === "\n" || set.has(ch.codePointAt(0)!);
    if (!ok) dropped = true;
    return ok;
  }).join("");
  if (dropped) warnings.push(`${label}: some characters aren't in the font and were left out.`);
  return out;
}

function wrap(f: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(next, size) <= maxWidth || !line) line = next;
      else { lines.push(line); line = word; }
    }
    lines.push(line);
  }
  return lines;
}

type R = { x: number; y: number; width: number; height: number };

function drawText(page: PDFPage, f: PDFFont, slot: Extract<Slot, { kind: "text" }>, raw: string, s: number, r: R, label: string, warnings: string[]) {
  let text = drawable(f, slot.upper ? raw.toUpperCase() : raw, label, warnings);
  const multi = Boolean(slot.lineHeight);
  if (!multi) text = text.replace(/\s+/g, " ");
  const color = rgb(0.05, 0.05, 0.05);

  // Shrink until it fits, down to a floor; past that, cut it and say so.
  let size = slot.size * s;
  const floor = size * (multi ? 0.7 : 0.55);
  const lh = () => size * (slot.lineHeight ?? 1);
  const fits = () =>
    multi ? wrap(f, text, size, r.width).length * lh() <= r.height : f.widthOfTextAtSize(text, size) <= r.width;
  while (!fits() && size > floor) size *= 0.96;

  let lines = multi ? wrap(f, text, size, r.width) : [text];
  if (!fits()) {
    warnings.push(`${label}: too long to fit, so it was cut. Shorten it or ask the designer.`);
    const max = multi ? Math.max(1, Math.floor(r.height / lh())) : 1;
    lines = lines.slice(0, max);
    let last = lines[lines.length - 1];
    while (last && f.widthOfTextAtSize(`${last}…`, size) > r.width) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last.trimEnd()}…`;
  }

  const ascent = f.heightAtSize(size, { descender: false });
  const blockHeight = multi ? lines.length * lh() : ascent;
  // Single lines sit in the middle of their box; text blocks start at the top.
  let baseline = multi ? r.y + r.height - ascent : r.y + (r.height - blockHeight) / 2 + size * 0.08;
  for (const line of lines) {
    const width = f.widthOfTextAtSize(line, size);
    const x = slot.align === "center" ? r.x + (r.width - width) / 2 : slot.align === "right" ? r.x + r.width - width : r.x;
    page.drawText(line, { x, y: baseline, size, font: f, color });
    baseline -= lh();
  }
}

function placeholder(page: PDFPage, f: PDFFont, text: string, r: R, size: number, align: "left" | "center" | "right" = "center") {
  const safe = [...text].filter((ch) => new Set(f.getCharacterSet()).has(ch.codePointAt(0)!)).join("");
  let fitSize = size;
  while (f.widthOfTextAtSize(safe, fitSize) > r.width && fitSize > 4) fitSize *= 0.9;
  const width = f.widthOfTextAtSize(safe, fitSize);
  const x = align === "center" ? r.x + (r.width - width) / 2 : align === "right" ? r.x + r.width - width : r.x;
  page.drawText(safe, { x, y: r.y + r.height / 2 - fitSize / 3, size: fitSize, font: f, color: RED });
}
