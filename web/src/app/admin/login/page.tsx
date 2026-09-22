import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm border border-line bg-white p-8">
        <h1 className="font-serif text-2xl font-bold">Tailored Times admin</h1>
        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <p className="mt-4 text-sm text-muted">Supabase isn&apos;t configured yet. Fill in web/.env.local first.</p>
        )}
      </div>
    </main>
  );
}
