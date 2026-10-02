import type { Metadata } from "next";
import Link from "next/link";
import { getCustomer } from "@/lib/account";

export const metadata: Metadata = { title: "Order received" };

// Confirmation after an order. Guests are offered an account, which also picks
// up this order (claimed by email when they sign up).
export default async function OrderSuccessPage(props: PageProps<"/order/success">) {
  const { ref } = await props.searchParams;
  const reference = typeof ref === "string" ? ref.replace(/[^A-Z0-9-]/g, "") : "";
  const customer = await getCustomer();

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
          Our team will contact you to go over the details. You pay cash on delivery, and delivery is free.
        </p>

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
