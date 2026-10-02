// Fills a fresh database with the templates and the price list, straight from
// the files the site itself uses. Safe to re-run: templates match on slug and
// the price row is id 1. Needs NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY in .env.local.
//
// Run: npm run db:seed

import { readFileSync } from "node:fs";
import { TEMPLATE_FORMS } from "../src/data/template-forms.ts";
import { TEMPLATES } from "../src/data/templates.ts";
import { DEFAULT_PRICING } from "../src/lib/pricing.ts";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");

const send = async (path: string, body: unknown, prefer: string) => {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: prefer },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res;
};

const templates = TEMPLATES.map((t, i) => ({
  slug: t.slug,
  legacy_slug: t.legacySlug,
  name: t.name,
  category: t.category,
  blurb: t.blurb,
  sort_order: i + 1,
  preview_images: t.previewImages,
  form_schema: TEMPLATE_FORMS[t.slug] ?? [],
}));

await send("templates?on_conflict=slug", templates, "resolution=merge-duplicates");
await send("pricing?on_conflict=id", [{ id: 1, config: DEFAULT_PRICING }], "resolution=merge-duplicates");

const count = async (table: string) => {
  const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact", Range: "0-0" },
  });
  return res.headers.get("content-range")?.split("/")[1] ?? "?";
};

console.log(`seeded: ${await count("templates")} templates, ${await count("pricing")} price row(s)`);
