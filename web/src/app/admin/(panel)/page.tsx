import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { ORDER_STATUSES } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  reference: string;
  template_name: string;
  format: string;
  size: string;
  copies: number;
  price: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
};

export default async function AdminOrdersPage(props: PageProps<"/admin">) {
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" && (ORDER_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, reference, template_name, format, size, copies, price, status, customer_name, customer_phone, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  if (q) {
    const like = `%${q.replace(/[%_,()]/g, "")}%`;
    query = query.or(`reference.ilike.${like},customer_name.ilike.${like},customer_phone.ilike.${like}`);
  }
  const { data, error } = await query;
  const orders = (data ?? []) as Row[];

  return (
    <>
      <h1 className="font-serif text-3xl font-bold">Orders</h1>
      <form className="mt-6 flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Search name, phone or TT-number" className="w-64 border border-line px-3 py-2 text-sm" />
        <select name="status" defaultValue={status} className="border border-line px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <button className="bg-ink px-4 py-2 text-sm font-semibold text-paper">Filter</button>
      </form>

      {error && <p className="mt-6 text-sm text-red-800">Couldn&apos;t load orders: {error.message}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase text-muted">
            <tr>
              <th className="py-2 pr-3">Order</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Customer</th>
              <th className="py-2 pr-3">Template</th>
              <th className="py-2 pr-3">Details</th>
              <th className="py-2 pr-3 text-right">Price</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line/60 hover:bg-paper/50">
                <td className="py-2 pr-3 font-mono"><Link href={`/admin/orders/${o.id}`} className="underline">{o.reference}</Link></td>
                <td className="py-2 pr-3 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString("en-GB")}</td>
                <td className="py-2 pr-3">{o.customer_name}<br /><span className="text-muted">{o.customer_phone}</span></td>
                <td className="py-2 pr-3">{o.template_name}</td>
                <td className="py-2 pr-3">{o.format}{o.format !== "Digital copy" && ` · ${o.size} · ×${o.copies}`}</td>
                <td className="py-2 pr-3 text-right">{Number(o.price).toFixed(1)} USD</td>
                <td className="py-2"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!error && orders.length === 0 && <p className="py-10 text-center text-muted">No orders{status || q ? " match this filter" : " yet"}.</p>}
      </div>
    </>
  );
}
