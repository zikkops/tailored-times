"use client";

import { useActionState } from "react";
import { updateProfile } from "../actions";
import type { Profile } from "@/lib/account";

// The customer's own details, used to pre-fill the order form next time.
const field =
  "w-full rounded-sm border border-ink/25 bg-white px-3 py-2.5 font-roboto text-sm text-ink focus:border-ink-2 focus:outline-none";
const label = "mb-2 block font-roboto text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/80";

export function DetailsForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, null);

  return (
    <form action={action} className="mt-6 max-w-[520px] space-y-5">
      <div>
        <label className={label} htmlFor="full_name">Full name</label>
        <input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} required autoComplete="name" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ""} autoComplete="tel" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="address">Delivery address</label>
        <textarea id="address" name="address" rows={3} defaultValue={profile?.address ?? ""} autoComplete="street-address" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="email">Email</label>
        <input id="email" value={email} readOnly disabled className={`${field} bg-paper/60 text-ink/60`} />
        <p className="mt-1 font-roboto text-xs text-muted">
          Your email is the one you sign in with. To change it, call us on +961 81 587 957.
        </p>
      </div>

      {state && (
        state.ok ? (
          <p role="status" className="rounded-sm border border-emerald-700/40 bg-emerald-50 p-3 font-roboto text-sm text-emerald-900">
            {state.message}
          </p>
        ) : (
          <p role="alert" className="rounded-sm border border-red-700/50 bg-red-50 p-3 font-roboto text-sm text-red-800">
            {state.error}
          </p>
        )
      )}

      <button disabled={pending} className="btn-dark font-medium">
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}
