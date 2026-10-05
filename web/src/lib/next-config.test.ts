import { describe, expect, it } from "vitest";
import { LEGACY_TEMPLATE_REDIRECTS } from "../../next.config.mjs";
import { TEMPLATES } from "../data/templates";

describe("next.config legacy redirects", () => {
  it("match every template's legacySlug", () => {
    expect(LEGACY_TEMPLATE_REDIRECTS).toEqual(
      Object.fromEntries(TEMPLATES.map((t) => [t.legacySlug, t.slug])),
    );
  });
});
