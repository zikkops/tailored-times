import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrderStatus } from "../../../actions";
import { StatusBadge } from "../../StatusBadge";
import { getOrderDetail } from "@/lib/admin-data";
import { ADMIN_DEMO } from "@/lib/env";
import { ORDER_STATUSES } from "@/lib/orders";
import { paymentLabel } from "@/lib/payments";

// One order: what was ordered, who it is for, what the customer wrote and
// uploaded, plus the status control and the history.

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-md border border-ink/10 bg-white p-5 ${className}`}>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/50">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  const detail = await getOrderDetail(id);
  if (!detail) notFound();
  const { order, answers, photos, events } = detail;

  const paper: [string, string][] = [
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
    ["Payment", paymentLabel(order.payment_method)],
  ];

  return (
    <>
      <Link href="/admin" className="text-sm text-ink/60 underline underline-offset-4">
        ← All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold">{order.reference}</h1>
          <StatusBadge status={order.status} big />
          <span className="text-sm text-ink/50">placed {when(order.created_at)}</span>
        </div>
        <p className="font-news text-3xl font-bold">
          {Number(order.price).toFixed(1)} <span className="font-roboto text-base font-medium">{order.currency}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Card title="Customer">
              <p className="font-medium">{order.customer_name}</p>
              <p className="mt-1 text-sm">
                <a href={`tel:${order.customer_phone}`} className="underline underline-offset-4">
                  {order.customer_phone}
                </a>
              </p>
              {order.customer_email && (
                <p className="text-sm">
                  <a href={`mailto:${order.customer_email}`} className="underline underline-offset-4">
                    {order.customer_email}
                  </a>
                </p>
              )}
              <p className="mt-3 whitespace-pre-line text-sm text-ink/70">{order.delivery_address}</p>
              {order.notes && (
                <p className="mt-3 border-l-2 border-amber-400 bg-amber-50 p-2 text-sm">{order.notes}</p>
              )}
            </Card>

            <Card title="Paper">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                {paper.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-ink/50">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          <Card title={`Their story (${answers.length})`}>
            {answers.length ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                {answers.map((a, i) => (
                  <div key={i} className="min-w-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/50">{a.label}</dt>
                    <dd className="mt-0.5 whitespace-pre-line break-words text-sm">
                      {a.value || <span className="text-ink/40">—</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-ink/50">Nothing filled in.</p>
            )}
          </Card>

          <Card title={`Photos (${photos.length})`}>
            {photos.length ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {photos.map((p) => (
                    <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="group block">
                      <span className="relative block aspect-square overflow-hidden rounded-sm border border-ink/10 bg-paper">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      </span>
                      <span className="mt-1 block truncate text-[11px] text-ink/60">{p.label}</span>
                    </a>
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink/50">
                  {ADMIN_DEMO
                    ? "Sample pictures. Real uploads open full size and links expire after an hour."
                    : "Links expire after an hour. Reload the page for fresh ones."}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink/50">No photos uploaded.</p>
            )}
          </Card>
        </div>

        <aside className="space-y-5">
          <form action={updateOrderStatus} className="rounded-md border border-ink/10 bg-white p-5">
            <input type="hidden" name="order_id" value={order.id} />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/50">Update status</h2>
            <select
              name="status"
              defaultValue={order.status}
              className="mt-3 w-full rounded-sm border border-ink/20 px-3 py-2 text-sm capitalize focus:border-ink focus:outline-none"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
            <textarea
              name="note"
              rows={3}
              placeholder="Internal note (optional)"
              className="mt-3 w-full rounded-sm border border-ink/20 px-3 py-2 text-sm focus:border-ink focus:outline-none"
            />
            <button className="mt-3 w-full rounded-sm bg-ink px-4 py-2.5 text-sm font-medium text-paper">
              Save status
            </button>
            {ADMIN_DEMO && <p className="mt-2 text-center text-xs text-ink/50">Demo mode: not saved.</p>}
          </form>

          <Card title="History">
            {events.length ? (
              <ol className="space-y-4">
                {events.map((e, i) => (
                  <li key={i} className="border-l-2 border-ink/15 pl-3">
                    <p className="text-[11px] text-ink/50">{when(e.created_at)}</p>
                    <p className="text-sm">
                      {e.from_status && <span className="text-ink/50">{e.from_status} → </span>}
                      <span className="font-medium capitalize">{e.to_status}</span>
                    </p>
                    {e.note && <p className="mt-0.5 whitespace-pre-line text-sm text-ink/70">{e.note}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-ink/50">Nothing yet.</p>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
