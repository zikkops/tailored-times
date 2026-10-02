import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForms } from "./AuthForms";
import { getCustomer } from "@/lib/account";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountLoginPage() {
  if (await getCustomer()) redirect("/account");

  return (
    <div className="mx-auto max-w-[440px] px-4 py-14">
      <div className="bg-[#f7f3ea] px-7 py-8 shadow-[0_10px_30px_rgba(13,12,29,0.12)]">
        <div className="flex items-baseline justify-between font-roboto text-[10px] font-medium uppercase tracking-[0.25em] text-ink/70">
          <span>The Tailored Times</span>
          <span>Subscribers</span>
        </div>
        <div className="mt-2 h-[5px] border-y border-ink/60" aria-hidden />
        <h1 className="mt-6 text-center font-script text-3xl text-ink-2">Your account</h1>
        <p className="mt-1 text-center font-roboto text-xs text-ink/60">
          Keep your details for next time and follow your orders.
        </p>

        {isSupabaseConfigured ? (
          <div className="mt-6">
            <AuthForms />
          </div>
        ) : (
          <p className="mt-6 text-center font-roboto text-sm text-ink/60">
            Accounts aren&apos;t connected yet. Please call us on +961 81 587 957.
          </p>
        )}
      </div>
    </div>
  );
}
