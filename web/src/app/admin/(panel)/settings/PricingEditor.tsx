"use client";

import { useActionState } from "react";
import { savePricing } from "../../actions";

export function PricingEditor({ initial }: { initial: string }) {
  const [message, action, pending] = useActionState(savePricing, "");
  return (
    <form action={action} className="mt-4">
      <textarea
        name="config"
        defaultValue={initial}
        rows={28}
        spellCheck={false}
        className="w-full border border-line p-3 font-mono text-xs"
      />
      <div className="mt-3 flex items-center gap-4">
        <button disabled={pending} className="bg-ink px-5 py-2 font-semibold text-paper disabled:opacity-60">
          {pending ? "Saving…" : "Save prices"}
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
