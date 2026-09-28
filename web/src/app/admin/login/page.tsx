import type { Metadata } from "next";
import { DemoLoginForm } from "./DemoLoginForm";
import { LoginForm } from "./LoginForm";
import { ADMIN_DEMO, DEMO_LOGIN, isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

// Admin sign-in. While the back office runs on sample data it takes the demo
// user and password (shown on the page); otherwise it is the real Supabase
// login.
export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[#f6f5f3] px-4 py-16">
      <div className="w-full max-w-sm bg-[#f7f3ea] px-7 py-8 shadow-[0_10px_30px_rgba(13,12,29,0.15)]">
        <div className="flex items-baseline justify-between font-roboto text-[10px] font-medium uppercase tracking-[0.25em] text-ink/70">
          <span>The Tailored Times</span>
          <span>Staff only</span>
        </div>
        <div className="mt-2 h-[5px] border-y border-ink/60" aria-hidden />

        <h1 className="mt-6 text-center font-script text-3xl text-ink-2">Newsroom</h1>
        <p className="mt-1 text-center font-roboto text-xs text-ink/60">Sign in to see orders and messages.</p>

        {ADMIN_DEMO ? (
          <>
            <DemoLoginForm user={DEMO_LOGIN.user} password={DEMO_LOGIN.password} />
            <p className="mt-5 rounded-sm bg-amber-100 p-3 text-center font-roboto text-xs text-amber-950">
              Demo mode: <strong>{DEMO_LOGIN.user}</strong>, password <strong>{DEMO_LOGIN.password}</strong>. The
              orders behind it are samples and nothing is saved.
            </p>
          </>
        ) : isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <p className="mt-6 text-center font-roboto text-sm text-ink/60">
            Supabase isn&apos;t configured yet. Fill in web/.env.local first.
          </p>
        )}
      </div>
    </main>
  );
}
