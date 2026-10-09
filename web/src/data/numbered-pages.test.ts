import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { NUMBERED_PAGE_STARTS, numberedPagesFor } from "./numbered-pages";
import { TEMPLATE_FORMS } from "./template-forms";
import { TEMPLATES } from "./templates";

describe("numbered pages", () => {
  it.each(TEMPLATES.map((t) => [t.slug, t] as const))("%s: page breaks match its fields, images exist", (slug, t) => {
    const form = TEMPLATE_FORMS[slug];
    const starts = NUMBERED_PAGE_STARTS[slug];
    expect(starts, "page starts").toBeDefined();
    for (const s of starts) expect(form.some((f) => f.label.startsWith(`${s}.`)), `field ${s}`).toBe(true);

    const { images, fieldPages } = numberedPagesFor(slug, form, t.previewImages);
    expect(fieldPages[0]).toBe(0);
    expect(new Set(fieldPages)).toEqual(new Set([0, 1, 2, 3]));
    expect(fieldPages).toEqual([...fieldPages].sort((a, b) => a - b));
    for (const src of images) expect(existsSync(`public${src}`), src).toBe(true);
  });
});
