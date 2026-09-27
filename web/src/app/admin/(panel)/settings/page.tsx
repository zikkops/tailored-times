import { setTemplateActive } from "../../actions";
import { PricingEditor } from "./PricingEditor";
import { TemplateEditor } from "./TemplateEditor";
import { listAdminTemplates } from "@/lib/admin-data";
import { getPricing } from "@/lib/data";
import { ADMIN_DEMO } from "@/lib/env";

// Templates (name, description, order, hidden or shown) and every number the
// price calculator uses.

export default async function AdminSettingsPage() {
  const [templates, pricing] = await Promise.all([listAdminTemplates(), getPricing()]);

  return (
    <>
      <h1 className="font-news text-3xl font-bold">Templates &amp; prices</h1>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/50">
            Templates ({templates.length})
          </h2>
          <p className="text-xs text-ink/50">Click one to edit its name, description and order.</p>
        </div>

        <ul className="mt-3 divide-y divide-ink/10 overflow-hidden rounded-md border border-ink/10 bg-white">
          {templates.map((t) => (
            <li key={t.id}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-paper/40">
                  <span className={t.active ? "font-medium" : "text-ink/45 line-through"}>
                    {t.name} <span className="font-mono text-xs text-ink/40">/{t.slug}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    {!t.active && (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-gray-600">
                        hidden
                      </span>
                    )}
                    <span className="text-xs text-ink/40 group-open:hidden">Edit ▾</span>
                    <span className="hidden text-xs text-ink/40 group-open:inline">Close ▴</span>
                  </span>
                </summary>
                <div className="border-t border-ink/10 bg-paper/30">
                  <TemplateEditor template={t} />
                  <form action={setTemplateActive} className="px-4 pb-4">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="active" value={String(!t.active)} />
                    <button className="rounded-sm border border-ink/30 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink hover:text-paper">
                      {t.active ? "Hide from the website" : "Show on the website"}
                    </button>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/50">Prices</h2>
        <p className="mt-1 max-w-[70ch] text-sm text-ink/60">
          Every number the calculator uses. Changes apply to the website immediately. Unit prices are per printed sheet,
          picked by the total sheets (copies × pages); <code className="text-xs">maxQty: null</code> means &ldquo;and
          above&rdquo;.
        </p>
        <PricingEditor initial={JSON.stringify(pricing, null, 2)} />
      </section>

      {ADMIN_DEMO && (
        <p className="mt-6 text-center text-xs text-ink/50">
          Demo mode: the sample templates and prices are shown, and nothing you change here is saved.
        </p>
      )}
    </>
  );
}
