import "server-only";

import { TEMPLATE_FORMS } from "@/data/template-forms";
import { TEMPLATES } from "@/data/templates";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";

export type Template = {
  id: string | null; // null when served from seed data
  slug: string;
  name: string;
  category: string;
  blurb: string;
  previewImages: string[];
  formSchema: FormField[];
};

export type FormField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "file";
  required?: boolean;
  help?: string;
  multiple?: boolean; // file fields that take several photos
};

// Step 2 of the order. Every template has its own numbered fields in
// src/data/template-forms.ts, generated from the owner's workbook; this is the
// fallback for a template that is not in it yet.
export const DEFAULT_FORM_SCHEMA: FormField[] = [
  { key: "main_names", label: "Who is the paper about?", type: "text", required: true, help: "Name(s) of the person, couple or company in the spotlight." },
  { key: "occasion_date", label: "Date of the occasion", type: "date" },
  { key: "headline", label: "Main headline", type: "text", help: "The big front-page headline. Leave empty and our team will write one." },
  { key: "stories", label: "Stories, memories and facts", type: "textarea", required: true, help: "Everything you want in the paper: anecdotes, milestones, jokes, quotes." },
  { key: "photos", label: "Photos", type: "file", help: "Up to 10 photos (JPG or PNG, 5 MB each)." },
];

// Always last, after the numbered fields (bug list R11).
const EXTRA_NOTES: FormField = {
  key: "extra_notes",
  label: "Anything else we should pay attention to?",
  type: "textarea",
  help: "Notes, comments or special requests about this paper.",
};

// The numbered fields for a template, plus the free-text box at the end.
export function formFor(slug: string): FormField[] {
  return [...(TEMPLATE_FORMS[slug] ?? DEFAULT_FORM_SCHEMA), EXTRA_NOTES];
}

const seedTemplates = (): Template[] =>
  TEMPLATES.map((t) => ({
    id: null,
    slug: t.slug,
    name: t.name,
    category: t.category,
    blurb: t.blurb,
    previewImages: t.previewImages,
    formSchema: formFor(t.slug),
  }));

type TemplateRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  blurb: string;
  preview_images: string[] | null;
  form_schema: FormField[] | null;
};

const fromRow = (r: TemplateRow): Template => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  category: r.category,
  blurb: r.blurb,
  previewImages: r.preview_images ?? [],
  formSchema: r.form_schema?.length ? r.form_schema : formFor(r.slug),
});

export async function getTemplates(): Promise<Template[]> {
  if (!isSupabaseConfigured) return seedTemplates();
  const supabase = await createClient();
  const { data, error } = await supabase.from("templates").select("*").eq("active", true).order("sort_order");
  if (error || !data) return seedTemplates(); // tables not created yet
  return (data as TemplateRow[]).map(fromRow);
}

export async function getTemplate(slug: string): Promise<Template | null> {
  if (!isSupabaseConfigured) return seedTemplates().find((t) => t.slug === slug) ?? null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("templates").select("*").eq("slug", slug).eq("active", true).maybeSingle();
  if (error) return seedTemplates().find((t) => t.slug === slug) ?? null;
  return data ? fromRow(data as TemplateRow) : null;
}

export async function getPricing(): Promise<PricingConfig> {
  if (!isSupabaseConfigured) return DEFAULT_PRICING;
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing").select("config").eq("id", 1).maybeSingle();
  if (error || !data) return DEFAULT_PRICING;
  return { ...DEFAULT_PRICING, ...(data.config as Partial<PricingConfig>) };
}
