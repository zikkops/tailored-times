import type { Metadata } from "next";
import Link from "next/link";
import { getCustomer } from "@/lib/account";
import { DEFAULT_PAYMENT_METHOD, paymentAfter, paymentLabel } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { settleWhishOrder } from "@/lib/whish-orders";

export const metadata: Metadata = { title: "Order received" };

// Confirmation after an order. Guests are offered an account, which also picks
// up this order (claimed by email when they sign up).
//
// Whish sends the customer back here, so this is also where the payment is
// settled: we ask Whish how it went rather than believing the address they
// arrived on. It is the backstop for a callback that never came, and for
// someone who closed the tab at Whish and came back later.
export default async function OrderSuccessPage(props: PageProps<"/order/success">) {
  const { ref } = await props.searchParams;
  const reference = typeof ref === "string" ? ref.replace(/[^A-Z0-9-]/g, "") : "";
  const customer = await getCustomer();

  let method = DEFAULT_PAYMENT_METHOD;
  let paid: "on_delivery" | "pending" | "paid" | "failed" | "refunded" = "on_delivery";
  if (reference && isSupabaseConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const db = createAdminClient();
    const { data: order } = await db
      .from("orders")
      .select("payment_method, payment_state")
      .eq("reference", reference)
      .maybeSingle();
    if (order) {
      method = order.payment_method;
      paid = order.payment_state;
      if (order.payment_method !== "cod" && (paid === "pending" || paid === "failed")) {
        try {
          const settled = await settleWhishOrder(reference);
          if (settled.state !== "unchanged") paid = settled.state;
        } catch (e) {
          console.error("settling the payment on the confirmation page failed", e);
        }
      }
    }
  }
  const awaitingPayment = paid === "pending" || paid === "failed";

  return (
    <div className="mx-auto max-w-[760px] px-4 py-16">
      <div className="bg-[#f7f3ea] px-6 py-10 text-center shadow-[0_10px_30px_rgba(13,12,29,0.12)] sm:px-12">
        <p className="font-roboto text-[11px] font-medium uppercase tracking-[0.25em] text-ink/70">
          The Tailored Times · Press room
        </p>
        <div className="mt-2 h-[5px] border-y border-ink/60" aria-hidden />

        <h1 className="mt-8 font-script text-[36px] leading-tight text-ink-2 sm:text-[46px]">
          Stop the presses — we got your order!
        </h1>

        {reference && (
          <p className="mt-4 font-roboto text-base">
            Your order number is <span className="font-mono font-bold">{reference}</span>.
          </p>
        )}
        <p className="mx-auto mt-3 max-w-[48ch] font-bauhaus text-base text-ink/80">
          Our team will contact you to go over the details. {paymentAfter(method)} Delivery is free.
        </p>
        <p className="mt-2 font-roboto text-xs uppercase tracking-[0.18em] text-ink/60">
          Payment: {paymentLabel(method)}
          {paid === "paid" && " · received"}
          {paid === "refunded" && " · refunded"}
        </p>

        {awaitingPayment && (
          <p className="mx-auto mt-5 max-w-[48ch] border border-ink/25 bg-white/60 p-3 font-bauhaus text-sm text-ink/80">
            We haven&apos;t had the payment from Whish yet. If you have just paid, it can take a moment — your order is
            safe either way, and our team will be in touch to finish it.
          </p>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {customer ? (
            <Link href="/account" className="btn-dark font-medium">
              Follow it in my account
            </Link>
          ) : (
            <Link href="/account/login" className="btn-dark font-medium">
              Create an account to follow it
            </Link>
          )}
          <Link href="/templates" className="btn-light">
            Order another
          </Link>
        </div>

        {!customer && (
          <p className="mt-5 font-roboto text-xs text-muted">
            Sign up with the same email you just used and this order appears in your account.
          </p>
        )}
      </div>
    </div>
  );
}
