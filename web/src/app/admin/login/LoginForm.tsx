"use client";

import { useActionState } from "react";
import { signInAdmin } from "../actions";

const input = "w-full border border-line bg-white px-3 py-2";

// The sign-in itself happens on the server (see signInAdmin), so attempts can
// be counted: guessing a password here is slowed down after a few tries.
export function LoginForm() {
  const [error, action, pending] = useActionState(signInAdmin, "");

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={input} />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={input} />
      </div>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <button type="submit" disabled={pending} className="w-full bg-ink px-4 py-2 font-semibold text-paper disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
