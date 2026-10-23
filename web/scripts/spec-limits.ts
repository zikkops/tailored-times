// How long an answer may be, read from the owner's typesetting sheet
// (data/automation-spec.xlsx). For every number printed on a template the
// sheet gives the font, the size, the page and, in column I, how many
// characters fit that spot: a headline is 30, the long story on page 1 is 485.
//
// Taking those as the limits on the order form means nobody types 2,000
// characters into a box that holds 30, which the team would otherwise have to
// cut by hand on every order.

import { readFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";

export type SpecLimit = { number: string; what: string; limit: number };

/** Sheet name in the spec workbook → template slug on the site. */
const SPEC_SHEETS: Record<string, string> = {
  "Birthday 1 Template": "birthday",
  "Birthday 2 Template": "birthday-2",
  "Anniversary Template": "anniversary",
  "Baby Shower Template": "baby-shower",
  "Corporate Template": "corporate",
  "Event Template": "events",
  "Fashion Magazine Template": "fashion-magazine",
  "Menu Template": "menu",
  "Mother's/Father's Day Template": "mothers-fathers-day",
  "Promotion Template": "promotion",
  "Retirement Template": "retirement",
  "Sport's Tribute Template": "sports-tribute",
  "Summer Camp Template": "summer-camp",
  "Wedding 1 Template": "wedding-1",
  "Wedding 2 Template": "wedding-2",
};

type Cells = Record<string, string>;

function rowCells(rowXml: string, strings: string[]): Cells {
  const cells: Cells = {};
  const cellPattern = /<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g;
  for (const cell of rowXml.matchAll(cellPattern)) {
    const attrs = cell[1] ?? cell[3] ?? "";
    const column = (attrs.match(/r="([A-Z]+)\d+"/) ?? [])[1];
    if (!column) continue;
    let value = ((cell[2] ?? "").match(/<v>([\s\S]*?)<\/v>/) ?? [])[1] ?? "";
    if (/t="s"/.test(attrs)) value = strings[Number(value)] ?? "";
    cells[column] = value;
  }
  return cells;
}

/** Every limit in the sheet, by template slug. */
export function readSpecLimits(file: URL): Record<string, SpecLimit[]> {
  const spec = unzipSync(new Uint8Array(readFileSync(file)));

  const strings = [...strFromU8(spec["xl/sharedStrings.xml"]!).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((entry) =>
    [...entry[1]!.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""),
  );
  const names = [...strFromU8(spec["xl/workbook.xml"]!).matchAll(/<sheet[^>]*name="([^"]+)"/g)].map((m) => m[1]!);
  const sheetFiles = Object.keys(spec)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));

  const bySlug: Record<string, SpecLimit[]> = {};
  names.forEach((name, index) => {
    const slug = SPEC_SHEETS[name];
    const file = sheetFiles[index];
    if (!slug || !file) return;

    const limits: SpecLimit[] = [];
    for (const row of strFromU8(spec[file]!).matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = rowCells(row[1]!, strings);
      const number = (cells.A ?? "").trim();
      const limit = Number(cells.I);
      if (!/^\d+(\.0)?$/.test(number) || !Number.isFinite(limit) || limit <= 0) continue;
      limits.push({ number: String(parseInt(number, 10)), what: (cells.B ?? "").trim(), limit: Math.round(limit) });
    }
    bySlug[slug] = limits;
  });
  return bySlug;
}

type Limitable = { key: string; label: string; type: string; maxLength?: number };

/**
 * Puts the sheet's limits on the matching boxes. The sheet describes one
 * printed element ("10. Year + Color"); the form splits that into two boxes,
 * and the limit belongs to the first part, never to a colour, a photo or a
 * date. Anything that cannot be matched to exactly one box is reported rather
 * than guessed at.
 */
export function applySpecLimits(slug: string, fields: Limitable[], limits: SpecLimit[]): string[] {
  const unmatched: string[] = [];
  const numberOf = (label: string) => (label.match(/^([A-Za-z0-9]+)\./) ?? [])[1] ?? "";
  const describe = (label: string) => label.slice(label.indexOf(".") + 1).trim().toLowerCase();

  for (const row of limits) {
    const base = row.what.split("+")[0]!.trim().toLowerCase();
    const atNumber = fields.filter(
      (field) => numberOf(field.label) === row.number && (field.type === "text" || field.type === "textarea"),
    );
    if (!atNumber.length) continue; // photos, dates and colours take no limit

    const exact = atNumber.filter((field) => describe(field.label) === base);
    // The sheet has the odd slip ("Tite"): a single text box at that number is
    // unambiguous, so it still gets its limit.
    const target = exact.length === 1 ? exact[0]! : atNumber.length === 1 ? atNumber[0]! : null;
    if (!target) {
      unmatched.push(`  ${slug} ${row.number} "${row.what}" (${row.limit}): no single box to put it on`);
      continue;
    }
    target.maxLength = row.limit;
  }
  return unmatched;
}
