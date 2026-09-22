"use client";

import { useActionState } from "react";
import { updateTemplate } from "../../actions";

type Props = {
  template: { id: string; name: string; category: string; blurb: string; sort_order: number };
};

const input = "w-full border border-line px-3 py-2 text-sm";

export function TemplateEditor({ template }: Props) {
  const [message, action, pending] = useActionState(updateTemplate, "");
  return (
    <form action={action} className="grid gap-3 bg-paper/40 p-4 sm:grid-cols-[2fr_2fr_1fr]">
      <input type="hidden" name="id" value={template.id} />
      <label className="text-xs font-semibold">
        Name
        <input name="name" defaultValue={template.name} required className={input} />
      </label>
      <label className="text-xs font-semibold">
        Category
        <input name="category" defaultValue={template.category} required className={input} />
      </label>
      <label className="text-xs font-semibold">
        Order
        <input name="sort_order" type="number" defaultValue={template.sort_order} required className={input} />
      </label>
      <label className="text-xs font-semibold sm:col-span-3">
        Description
        <textarea name="blurb" defaultValue={template.blurb} rows={3} className={input} />
      </label>
      <div className="flex items-center gap-3 sm:col-span-3">
        <button disabled={pending} className="bg-ink px-4 py-1.5 text-sm font-semibold text-paper disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
