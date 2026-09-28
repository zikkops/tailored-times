"use client";

import { useActionState } from "react";
import { demoSignIn } from "../actions";

// The pretend login used while the admin runs on sample data.
export function DemoLoginForm({ user, password }: { user: string; password: string }) {
  const [error, action, pending] = useActionState(demoSignIn, "");
  const field =
    "w-full rounded-sm border border-ink/25 bg-white px-3 py-2.5 font-roboto text-sm text-ink focus:border-ink-2 focus:outline-none";
  const label = "mb-2 block font-roboto text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/80";

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label className={label} htmlFor="user">
          Email
        </label>
        <input id="user" name="user" type="email" defaultValue={user} autoComplete="username" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          defaultValue={password}
          autoComplete="current-password"
          required
          className={field}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-sm border border-red-700 bg-red-50 p-2.5 font-roboto text-sm text-red-800">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-dark w-full !py-3 font-medium">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
