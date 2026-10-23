import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { parseColor } from "./colors";

vi.mock("server-only", () => ({}));
const { renderPrintPdf } = await import("./render");

const field = (label: string, value = "") => ({ label, value });

// A plain test photo, so the test needs no files.
const photo = () =>
  sharp({ create: { width: 1200, height: 900, channels: 3, background: { r: 60, g: 120, b: 190 } } }).jpeg().toBuffer();

describe("print PDF", () => {
  it("fills Birthday 1's cover and has nothing to warn about", async () => {
    const { pdf, warnings } = await renderPrintPdf({
      template: "birthday",
      size: "Tabloid",
      fields: {
        n1_edition: field("1. Edition", "Golden Edition"),
        n2_location: field("2. Location", "Jounieh"),
        n3_title: field("3. Title", "Hold the front page"),
        n4_person: field("4. Person", "Maya"),
        n5_color: field("5. Color", "navy"),
        n6_photo: field("6. Photo"),
        n7_title: field("7. Title", "About Maya"),
        n8_text: field(
          "8. Text",
          "Maya turns thirty today, and the whole town knows it. She learned to swim at four, to drive at eighteen, and to make the best knafeh in the family at twenty-five. Friends call her the one who never forgets a birthday, so today we return the favour.",
        ),
      },
      photos: { n6_photo: await photo() },
    });
    if (process.env.PRINT_OUT) writeFileSync(process.env.PRINT_OUT, pdf);
    expect(warnings).toEqual([]);
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
  });

  it("flags what is missing, too long or not a colour", async () => {
    const { warnings } = await renderPrintPdf({
      template: "birthday",
      size: "Broadsheet",
      fields: {
        n1_edition: field("1. Edition"),
        n3_title: field("3. Title", "A headline far too long to ever fit on a single line of the front page"),
        n5_color: field("5. Color", "sparkly"),
        n6_photo: field("6. Photo"),
      },
      photos: {},
    });
    expect(warnings).toEqual(
      expect.arrayContaining([
        "1. Edition: empty.",
        "6. Photo: no photo.",
        expect.stringContaining("3. Title: too long"),
        expect.stringContaining('"sparkly" isn\'t a colour'),
      ]),
    );
  });

  it("reads hex codes and colour names", () => {
    expect(parseColor("#0D0C1D")).toEqual([13, 12, 29]);
    expect(parseColor("abc")).toEqual([170, 187, 204]);
    expect(parseColor(" Navy ")).toEqual([31, 42, 90]);
    expect(parseColor("sparkly")).toBeNull();
  });
});
