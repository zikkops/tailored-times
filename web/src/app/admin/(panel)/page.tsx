import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { listOrders, orderStats } from "@/lib/admin-data";
import { ORDER_STATUSES } from "@/lib/orders";

// Orders: a few totals at the top, then the list with a search box and a
// status filter. The whole page reads through lib/admin-data, so it looks the
// same on sample data as on the real thing.

const money = (n: number) => `${Number(n).toFixed(1)} USD`;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/50">{label}</p>
      <p className="mt-1 font-news text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}

export default async function AdminOrdersPage(props: PageProps<"/admin">) {
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" && (ORDER_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";

  const [{ orders, error }, stats] = await Promise.all([listOrders({ status, q }), orderStats()]);
  const inProgress = stats.byStatus.created + stats.byStatus.printing + stats.byStatus.delivering;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-news text-3xl font-bold">Orders</h1>
        <p className="text-sm text-ink/60">{stats.total} orders in total</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="New" value={String(stats.byStatus.ordered)} hint="Waiting to be started" />
        <Tile label="In progress" value={String(inProgress)} hint="Created, printing or delivering" />
        <Tile label="Open value" value={money(stats.openValue)} hint="Everything not delivered or cancelled" />
        <Tile label="This month" value={String(stats.monthCount)} hint={money(stats.monthValue)} />
      </div>

      {/* Filters */}
      <form className="mt-8 flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, phone or TT number"
          className="w-64 rounded-sm border border-ink/20 bg-white px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-sm border border-ink/20 bg-white px-3 py-2 text-sm capitalize focus:border-ink focus:outline-none"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
        <button className="rounded-sm bg-ink px-4 py-2 text-sm font-medium text-paper">Filter</button>
        {(status || q) && (
          <Link href="/admin" className="text-sm text-ink/60 underline">
            Clear
          </Link>
        )}
      </form>

      {error && <p className="mt-6 text-sm text-red-800">Couldn&apos;t load orders: {error}</p>}

      <div className="mt-4 overflow-x-auto rounded-md border border-ink/10 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-ink/10 text-[11px] uppercase tracking-[0.15em] text-ink/50">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Paper</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {orders.map((o) => (
              <tr key={o.id} className="transition-colors hover:bg-paper/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-mono text-[13px] font-medium text-ink underline decoration-ink/30 underline-offset-4">
                    {o.reference}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink/70">{day(o.created_at)}</td>
                <td className="px-4 py-3">
                  {o.customer_name}
                  <span className="block text-xs text-ink/50">{o.customer_phone}</span>
                </td>
                <td className="px-4 py-3">{o.template_name}</td>
                <td className="px-4 py-3 text-ink/70">
                  {o.format}
                  {o.format !== "Digital copy" && ` · ${o.size} · ×${o.copies}`}
                  {o.frames && " · framed"}
                  {o.designer && " · designer"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{money(o.price)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!error && orders.length === 0 && (
          <p className="py-12 text-center text-sm text-ink/50">No orders{status || q ? " match this filter" : " yet"}.</p>
        )}
      </div>
    </>
  );
}
