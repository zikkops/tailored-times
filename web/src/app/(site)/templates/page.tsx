import type { Metadata } from "next";
import { TemplateGallery } from "@/components/TemplateGallery";
import { getTemplates } from "@/lib/data";

export const metadata: Metadata = { title: "Templates" };

// Template gallery. The page header matches the home page banners (small-caps
// section line, script title, double rule); the grid and filter are in
// TemplateGallery.
export default async function TemplatesPage() {
  const templates = await getTemplates();
  return (
    <div className="mx-auto max-w-[1140px] px-4 pb-20 pt-10 sm:pt-14">
      <header className="mx-auto max-w-[760px] text-center">
        <p className="font-roboto text-[11px] font-medium uppercase tracking-[0.3em] text-muted sm:text-xs">
          The Tailored Times · Template Gallery
        </p>
        <h1 className="mt-2 font-script text-[40px] leading-tight text-ink-2 sm:text-[60px]">Pick your template</h1>
        <div className="mt-3 h-[6px] border-y border-ink/70" aria-hidden />
        <p className="mt-4 font-bauhaus text-base text-ink/80 sm:text-lg">
          {templates.length} ready-made front pages. Pick one, and we make it yours.
        </p>
      </header>

      <TemplateGallery
        templates={templates.map((t) => ({
          slug: t.slug,
          name: t.name,
          category: t.category,
          blurb: t.blurb,
          cover: t.previewImages[0] ?? null,
        }))}
      />
    </div>
  );
}
