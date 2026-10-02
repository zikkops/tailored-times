"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { sendReset, signIn, signUp, type AuthResult } from "../actions";

// Sign in, create an account, or ask for a reset link: one card, three states.

const field =
  "w-full rounded-sm border border-ink/25 bg-white px-3 py-2.5 font-roboto text-sm text-ink focus:border-ink-2 focus:outline-none";
const label = "mb-2 block font-roboto text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/80";

function Message({ state }: { state: AuthResult | null }) {
  if (!state) return null;
  return state.ok ? (
    <p role="status" className="rounded-sm border border-emerald-700/40 bg-emerald-50 p-3 font-roboto text-sm text-emerald-900">
      {state.message}
    </p>
  ) : (
    <p role="alert" className="rounded-sm border border-red-700/50 bg-red-50 p-3 font-roboto text-sm text-red-800">
      {state.error}
    </p>
  );
}

export function AuthForms() {
  const [tab, setTab] = useState<"in" | "up" | "reset">("in");
  const [inState, inAction, inPending] = useActionState(signIn, null);
  const [upState, upAction, upPending] = useActionState(signUp, null);
  const [resetState, resetAction, resetPending] = useActionState(sendReset, null);

  const tabClass = (active: boolean) =>
    `flex-1 border-b-2 pb-2 font-roboto text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${
      active ? "border-ink text-ink" : "border-ink/15 text-ink/50 hover:text-ink"
    }`;

  return (
    <div>
      {tab !== "reset" ? (
        <div className="flex gap-6">
          <button type="button" onClick={() => setTab("in")} className={tabClass(tab === "in")}>
            Sign in
          </button>
          <button type="button" onClick={() => setTab("up")} className={tabClass(tab === "up")}>
            Create account
          </button>
        </div>
      ) : (
        <p className="font-roboto text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/80">Reset password</p>
      )}

      {tab === "in" && (
        <form action={inAction} className="mt-6 space-y-4">
          <div>
            <label className={label} htmlFor="in-email">Email</label>
            <input id="in-email" name="email" type="email" required autoComplete="email" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="in-password">Password</label>
            <input id="in-password" name="password" type="password" required autoComplete="current-password" className={field} />
          </div>
          <Message state={inState} />
          <button disabled={inPending} className="btn-dark w-full !py-3 font-medium">
            {inPending ? "Signing in…" : "Sign in"}
          </button>
          <button type="button" onClick={() => setTab("reset")} className="w-full text-center font-roboto text-xs text-ink/60 underline underline-offset-4">
            Forgotten your password?
          </button>
        </form>
      )}

      {tab === "up" && (
        <form action={upAction} className="mt-6 space-y-4">
          <div>
            <label className={label} htmlFor="up-name">Full name</label>
            <input id="up-name" name="full_name" required autoComplete="name" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="up-phone">Phone</label>
            <input id="up-phone" name="phone" type="tel" autoComplete="tel" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="up-email">Email</label>
            <input id="up-email" name="email" type="email" required autoComplete="email" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="up-password">Password</label>
            <input id="up-password" name="password" type="password" required minLength={8} autoComplete="new-password" className={field} />
            <p className="mt-1 font-roboto text-xs text-muted">At least 8 characters.</p>
          </div>
          <Message state={upState} />
          <button disabled={upPending} className="btn-dark w-full !py-3 font-medium">
            {upPending ? "Creating…" : "Create account"}
          </button>
          <p className="text-center font-roboto text-xs text-muted">
            Orders you placed with this email before will appear in your account.
          </p>
        </form>
      )}

      {tab === "reset" && (
        <form action={resetAction} className="mt-6 space-y-4">
          <div>
            <label className={label} htmlFor="reset-email">Email</label>
            <input id="reset-email" name="email" type="email" required autoComplete="email" className={field} />
          </div>
          <Message state={resetState} />
          <button disabled={resetPending} className="btn-dark w-full !py-3 font-medium">
            {resetPending ? "Sending…" : "Send reset link"}
          </button>
          <button type="button" onClick={() => setTab("in")} className="w-full text-center font-roboto text-xs text-ink/60 underline underline-offset-4">
            Back to sign in
          </button>
        </form>
      )}

      <p className="mt-6 border-t border-ink/15 pt-4 text-center font-roboto text-xs text-muted">
        You don&apos;t need an account to order.{" "}
        <Link href="/templates" className="underline underline-offset-4">
          Pick a template
        </Link>
      </p>
    </div>
  );
}
