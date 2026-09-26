// Builds src/data/template-forms.ts from data/templates-numbering.xlsx: the
// owner's numbered field list for every template, which becomes step 2 of the
// order ("Tell us your story"). Run: npm run gen:forms
//
// The workbook has one sheet per template. Each row is:
//   A = the number printed on the template (1.0, 20.0, "A", "a"…)
//   B = what goes there ("Text", "Photo", "Title + Color", "Icon (Photo)"…)
//   C = a note from the owner, shown as help under the field
//
// Rules applied here:
//   - "X + Y" becomes two fields with the same number (Photo + Color → an
//     upload and a colour box), except "Item, Ingredients and Price".
//   - Photo/Logo (Photo)/Element (Photo) → upload; "Additional Photos" takes many.
//   - Date → date box. Text-ish things → a growing text box. Everything else
//     (Title, Name, Location, Year…) → a single-line box.
//   - Notes lose their "Please add this disclaimer:" lead-in.

import { readFileSync, writeFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";

type Field = {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "file";
  help?: string;
  multiple?: boolean;
};

// Sheet name in the workbook → template slug on the site.
const SLUGS: Record<string, string> = {
  "Anniversary Template": "anniversary",
  "Baby Shower Template": "baby-shower",
  "Birthday 1 Template": "birthday",
  "Birthday 2 Template": "birthday-2",
  "Corporate Template": "corporate",
  "Event Template": "events",
  "Fashion Magazine Template": "fashion-magazine",
  "Menu Template": "menu",
  "MothersFathers Day Template": "mothers-fathers-day",
  "Promotion Template": "promotion",
  "Retirement Template": "retirement",
  "Sports Tribute Template": "basketball-tribute",
  "Summer Camp Template": "summer-camp",
  "Wedding 1 Template": "christian-wedding",
  "Wedding 2 Template": "muslim-wedding",
};

const xlsx = unzipSync(readFileSync(new URL("../data/templates-numbering.xlsx", import.meta.url)));
const read = (path: string) => strFromU8(xlsx[path]);

const decode = (s: string) =>
  s
    .replace(/&#10;/g, "\n")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/’/g, "'")
    .trim();

const shared = [...read("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
  decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join("")),
);

const workbook = read("xl/workbook.xml");
const relsXml = read("xl/_rels/workbook.xml.rels");
const rels: Record<string, string> = {};
for (const m of relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) rels[m[1]] = m[2].replace(/^\/?xl\//, "");
const sheets = [...workbook.matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="(rId\d+)"/g)].map((m) => ({
  name: decode(m[1]),
  file: "xl/" + rels[m[2]],
}));

function rowsOf(file: string): string[][] {
  const xml = read(file);
  const rows: string[][] = [];
  for (const row of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const c of row[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const col = c[1].charCodeAt(0) - 65; // A=0, B=1, C=2…
      const value = (c[3].match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      const inline = [...c[3].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join("");
      cells[col] = /t="s"/.test(c[2]) && value !== undefined ? shared[+value] : decode(inline || value || "");
    }
    rows.push(cells);
  }
  return rows;
}

// "1.0" → "1", "A" stays "A"
const numberLabel = (raw: string) => {
  const n = Number(raw);
  return Number.isFinite(n) ? String(Math.round(n)) : raw.trim();
};

// Notes written to us rather than to the customer never reach the site.
const INTERNAL_NOTE = /\bplz\b|give them option|on the website is|should be \d/i;

const cleanNote = (note: string) => {
  const text = note
    .replace(/^[\s\S]*?(?:disclaimer|please|plz)\s*:\s*/i, "")
    .replace(/^(add this please|give the option to add a photo and add this)\s*:?\s*/i, "")
    .trim();
  if (!text || INTERNAL_NOTE.test(text)) return "";
  return /[.!?]$/.test(text) ? text : text + ".";
};

function fieldType(part: string): { type: Field["type"]; multiple?: boolean } {
  const p = part.toLowerCase();
  if (/photo|logo \(photo\)|\(insert photo\)/.test(p)) {
    return { type: "file", multiple: /additional photos|photos for/.test(p) };
  }
  if (/^date$/.test(p) || /^text \+ date$/.test(p)) return { type: "date" };
  if (/text|item, ingredients|words|features|game names|names for the family tree/.test(p)) return { type: "textarea" };
  return { type: "text" };
}

const HELP_BY_TYPE: Record<string, string> = {
  color: "A colour name or hex code, e.g. navy or #0D0C1D.",
};

function buildFields(rows: string[][]): Field[] {
  const fields: Field[] = [];
  const used = new Set<string>();
  for (const row of rows.slice(2)) {
    // rows 1–2 are the sheet title and the header
    const [num, what, note] = [row[0] ?? "", row[1] ?? "", row[2] ?? ""];
    if (!num.trim() || !what.trim()) continue;

    const label = numberLabel(num);
    // "Photo + Color" → two fields; "Item, Ingredients and Price" stays whole.
    const parts = /item, ingredients/i.test(what) ? [what] : what.split("+").map((p) => p.trim()).filter(Boolean);

    parts.forEach((part, i) => {
      const { type, multiple } = fieldType(part);
      let key = `n${label}_${part.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
      while (used.has(key)) key += `_${i + 2}`;
      used.add(key);

      const help = [cleanNote(note), /color/i.test(part) ? HELP_BY_TYPE.color : ""].filter(Boolean).join(" ");
      fields.push({
        key,
        label: `${label}. ${part.replace(/\bTite\b|\bTItle\b/, "Title")}`,
        type,
        ...(multiple ? { multiple: true } : {}),
        ...(help ? { help } : {}),
      });

      // "give them the option to insert a photo as well": add the upload the
      // note asks for (bug list R33), rather than showing the note itself.
      if (type !== "file" && /insert a photo as well|option to add a photo|option to insert a photo/i.test(note)) {
        const photoKey = `${key}_photo`;
        used.add(photoKey);
        fields.push({
          key: photoKey,
          label: `${label}. ${part} (Photo)`,
          type: "file",
          help: "Have your own artwork? Upload it here instead.",
        });
      }
    });
  }
  return fields;
}

const forms: Record<string, Field[]> = {};
const missing: string[] = [];
for (const sheet of sheets) {
  if (sheet.name === "Annex") continue;
  const slug = SLUGS[sheet.name];
  if (!slug) {
    missing.push(sheet.name);
    continue;
  }
  forms[slug] = buildFields(rowsOf(sheet.file));
}

const out = `// GENERATED by scripts/generate-template-forms.ts from
// data/templates-numbering.xlsx. Do not edit by hand: re-run \`npm run gen:forms\`.
//
// Step 2 of the order for each template: the owner's numbered fields, in the
// order they are printed on the paper.

import type { FormField } from "@/lib/data";

export const TEMPLATE_FORMS: Record<string, FormField[]> = ${JSON.stringify(forms, null, 2)};
`;

writeFileSync(new URL("../src/data/template-forms.ts", import.meta.url), out);

const counts = Object.entries(forms).map(([slug, f]) => `${slug}: ${f.length}`);
console.log(`src/data/template-forms.ts written\n  ${counts.join("\n  ")}`);
if (missing.length) console.log("SHEETS WITH NO SLUG (check SLUGS):", missing.join(", "));
