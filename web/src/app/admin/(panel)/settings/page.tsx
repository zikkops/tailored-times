import { setTemplateActive } from "../../actions";
import { PricingEditor } from "./PricingEditor";
import { TemplateEditor } from "./TemplateEditor";
import { getPricing } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const [{ data: templates }, pricing] = await Promise.all([
    supabase.from("templates").select("id, name, slug, category, blurb, sort_order, active").order("sort_order"),
    getPricing(),
  ]);

  return (
    <>
      <h1 className="font-serif text-3xl font-bold">Templates &amp; prices</h1>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-bold">Templates</h2>
        <p className="mt-1 text-sm text-muted">Click a template to edit its name, category, description and gallery order. Hidden templates disappear from the gallery and can&apos;t be ordered.</p>
        <ul className="mt-4 divide-y divide-line border border-line">
          {templates?.map((t) => (
            <li key={t.id} className="text-sm">
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2">
                  <span className={t.active ? "" : "text-muted line-through"}>
                    {t.name} <span className="text-muted">/{t.slug}</span>
                  </span>
                  <span className="text-xs text-muted">Edit ▾</span>
                </summary>
                <TemplateEditor template={t} />
                <form action={setTemplateActive} className="px-4 pb-4">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="active" value={String(!t.active)} />
                  <button className="border border-ink px-3 py-1">{t.active ? "Hide from the website" : "Show on the website"}</button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-bold">Prices</h2>
        <p className="mt-1 text-sm text-muted">
          Every number the price calculator uses. Changes apply to the website immediately. Unit prices are per printed
          sheet, chosen by the total sheets (copies × pages); <code>maxQty: null</code> means &ldquo;and above&rdquo;.
        </p>
        <PricingEditor initial={JSON.stringify(pricing, null, 2)} />
      </section>
    </>
  );
}
