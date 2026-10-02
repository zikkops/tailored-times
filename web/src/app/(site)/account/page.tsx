import type { Metadata } from "next";
import Link from "next/link";
import { listMyOrders, requireCustomer } from "@/lib/account";

export const metadata: Metadata = { title: "My orders" };

const money = (n: number, c: string) => `${Number(n).toFixed(1)} ${c}`;
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// What this person has ordered before, newest first.
export default async function MyOrdersPage() {
  await requireCustomer();
  const orders = await listMyOrders();

  return (
    <>
      <h1 className="font-script text-[34px] leading-tight text-ink-2">My orders</h1>
      <div className="mt-2 h-[5px] border-y border-ink/60" aria-hidden />

      {orders.length === 0 ? (
        <div className="mt-8 border border-dashed border-ink/30 p-8 text-center">
          <p className="font-bauhaus text-base text-ink/80">No orders yet.</p>
          <p className="mt-1 font-roboto text-sm text-muted">
            Orders placed with this email before you signed up appear here automatically.
          </p>
          <Link href="/templates" className="btn-dark mt-5 font-medium">
            Pick a template
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="border border-ink/15 bg-white p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="font-news text-xl font-bold">{o.template_name}</p>
                  <p className="mt-0.5 font-roboto text-xs text-muted">
                    <span className="font-mono">{o.reference}</span> · {day(o.created_at)}
                  </p>
                </div>
                <p className="font-news text-2xl font-bold">{money(o.price, o.currency)}</p>
              </div>

              <p className="mt-3 font-bauhaus text-sm text-ink/80">
                {o.format}
                {o.format !== "Digital copy" && ` · ${o.size} · ${o.copies} ${o.copies === 1 ? "copy" : "copies"}`}
                {o.frames && " · framed"}
                {o.designer && " · designer"}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-3">
                <p className="font-roboto text-xs uppercase tracking-[0.18em] text-ink/70">Status: {o.status}</p>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="font-roboto text-xs font-medium uppercase tracking-[0.18em] underline underline-offset-4"
                >
                  See details →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
