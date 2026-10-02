import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyOrder, requireCustomer } from "@/lib/account";
import { ORDER_STATUSES } from "@/lib/orders";

export const metadata: Metadata = { title: "Your order" };

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

// One of the customer's own orders: what they ordered, what they told us, and
// how far along it is. Read-only; changes go through the team.
export default async function MyOrderPage(props: PageProps<"/account/orders/[id]">) {
  await requireCustomer();
  const { id } = await props.params;
  const detail = await getMyOrder(id);
  if (!detail) notFound();
  const { order, answers, events } = detail;

  // The progress bar shows the normal path; a cancelled order says so instead.
  const steps: string[] = ORDER_STATUSES.filter((s) => s !== "cancelled");
  const reached = steps.indexOf(order.status);

  const rows: [string, string][] = [
    ["Template", order.template_name],
    ["Format", order.format],
    ...(order.format !== "Digital copy"
      ? ([
          ["Size", order.size],
          ["Pages", String(order.pages)],
          ["Copies", String(order.copies)],
          ["Frame", order.frames ? "Yes" : "No"],
        ] as [string, string][])
      : []),
    ["Designer", order.designer ? "Yes" : "No"],
    ["Payment", order.payment_method === "cod" ? "Cash on delivery" : order.payment_method],
    ["Price", `${Number(order.price).toFixed(1)} ${order.currency}`],
  ];

  return (
    <>
      <Link href="/account" className="font-roboto text-sm text-ink/60 underline underline-offset-4">
        ← My orders
      </Link>

      <h1 className="mt-3 font-script text-[34px] leading-tight text-ink-2">{order.template_name}</h1>
      <p className="font-roboto text-xs text-muted">
        <span className="font-mono">{order.reference}</span> · placed {when(order.created_at)}
      </p>
      <div className="mt-3 h-[5px] border-y border-ink/60" aria-hidden />

      <section className="mt-6">
        {order.status === "cancelled" ? (
          <p className="border border-ink/20 bg-paper p-3 font-roboto text-sm">This order was cancelled.</p>
        ) : (
          <ol className="flex flex-wrap gap-2">
            {steps.map((s, i) => (
              <li
                key={s}
                className={`flex-1 border-t-4 pt-2 font-roboto text-[11px] uppercase tracking-[0.12em] ${
                  i <= reached ? "border-ink-2 text-ink" : "border-ink/15 text-ink/40"
                }`}
              >
                {s}
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="font-roboto text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60">Your paper</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 font-bauhaus text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-ink/50">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="font-roboto text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60">Delivery</h2>
          <p className="mt-3 whitespace-pre-line font-bauhaus text-sm">{order.delivery_address}</p>
          {order.notes && (
            <p className="mt-3 border-l-2 border-ink/30 pl-3 font-bauhaus text-sm text-ink/80">{order.notes}</p>
          )}
        </section>
      </div>

      {answers.length > 0 && (
        <section className="mt-8">
          <h2 className="font-roboto text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60">
            What you told us
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {answers.map((a, i) => (
              <div key={i}>
                <dt className="font-roboto text-[11px] uppercase tracking-[0.12em] text-ink/50">{a.label}</dt>
                <dd className="mt-0.5 whitespace-pre-line font-bauhaus text-sm">{a.value || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {events.length > 0 && (
        <section className="mt-8">
          <h2 className="font-roboto text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60">History</h2>
          <ol className="mt-3 space-y-2 font-roboto text-sm">
            {events.map((e, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-ink/50">{when(e.created_at)}</span>
                <span className="capitalize">{e.to_status}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="mt-10 border-t border-ink/10 pt-5 font-roboto text-sm text-muted">
        Something to change? Call us on{" "}
        <a href="tel:+96181587957" className="underline underline-offset-4">
          +961 81 587 957
        </a>{" "}
        or{" "}
        <Link href="/contact" className="underline underline-offset-4">
          send a message
        </Link>
        .
      </p>
    </>
  );
}
