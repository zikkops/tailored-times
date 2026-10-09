// Step 2 of the order shows each template's four numbered pages
// (public/templates/<slug>/numbered/1-4.jpg, taken from the owner's PDFs; the
// PDFs' last page, a plain list of the numbers, is left out). As the customer
// moves through the fields, the preview turns to the page the field is printed on.
//
// For each template: the first field number printed on pages 2, 3 and 4.
// Fields are listed in printed order (template-forms.ts), so every field from
// that number on is on that page or a later one.

import type { FormField } from "@/lib/data";

export const NUMBERED_PAGE_STARTS: Record<string, [string, string, string]> = {
  menu: ["B", "C", "D"],
  events: ["c", "22", "33"],
  "wedding-1": ["8", "25", "31"],
  "sports-tribute": ["13", "25", "31"],
  "summer-camp": ["11", "18", "25"],
  "mothers-fathers-day": ["10", "19", "24"],
  retirement: ["7", "17", "22"],
  promotion: ["9", "14", "17"],
  "wedding-2": ["9", "34", "46"],
  "fashion-magazine": ["13", "27", "44"],
  anniversary: ["10", "18", "40"],
  "baby-shower": ["9", "26", "31"],
  birthday: ["9", "19", "33"],
  corporate: ["13", "28", "46"],
  "birthday-2": ["17", "22", "29"],
};

// "12. Title" → "12", "A. Photo" → "A".
const numberOf = (f: FormField) => f.label.split(".")[0].trim();

// The numbered page images for a template, and the page (0-based) each form
// field is on. Fields after the numbered ones (the notes box) stay on page 4.
// The images sit in a `numbered` folder next to the template's previews (a few
// templates keep their old folder names, e.g. wedding-1 → christian-wedding).
export function numberedPagesFor(slug: string, form: FormField[], previewImages: string[]) {
  const starts = NUMBERED_PAGE_STARTS[slug];
  const folder = previewImages[0]?.slice(0, previewImages[0].lastIndexOf("/"));
  if (!starts || !folder) return { images: [], fieldPages: [] };
  const firstIndex = starts.map((s) => form.findIndex((f) => numberOf(f) === s));
  const fieldPages = form.map((_, i) => firstIndex.filter((at) => at !== -1 && at <= i).length);
  const images = [1, 2, 3, 4].map((p) => `${folder}/numbered/${p}.jpg`);
  return { images, fieldPages };
}
