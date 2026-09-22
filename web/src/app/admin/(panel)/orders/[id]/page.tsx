import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrderStatus } from "../../../actions";
import { StatusBadge } from "../../StatusBadge";
import { ORDER_STATUSES } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient(); // RLS: admins only
  const [{ data: order }, { data: answers }, { data: files }, { data: events }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_answers").select("label, value").eq("order_id", id).order("id"),
    supabase.from("order_files").select("storage_path, original_name").eq("order_id", id).order("id"),
    supabase
      .from("order_events")
      .select("from_status, to_status, note, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!order) notFound();

  // Photos live in a private bucket: hand out short-lived signed links.
  let photos: { url: string; name: string }[] = [];
  if (files?.length) {
    const { data: signed } = await createAdminClient()
      .storage.from("order-uploads")
      .createSignedUrls(files.map((f) => f.storage_path), 60 * 60);
    photos = (signed ?? []).flatMap((s, i) =>
      s.signedUrl ? [{ url: s.signedUrl, name: files[i].original_name ?? `photo ${i + 1}` }] : [],
    );
  }

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
    ["Designer needed", order.designer ? "Yes" : "No"],
    ["Price", `${Number(order.price).toFixed(1)} ${order.currency}`],
    ["Payment", order.payment_method === "cod" ? "Cash on delivery" : order.payment_method],
  ];

  return (
    <>
      <Link href="/admin" className="text-sm underline">
        ← All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-3xl font-bold">{order.reference}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-muted">placed {new Date(order.created_at).toLocaleString("en-GB")}</span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          <section>
            <h2 className="font-serif text-xl font-bold">Customer</h2>
            <p className="mt-2">{order.customer_name}</p>
            <p>
              <a href={`tel:${order.customer_phone}`} className="underline">
                {order.customer_phone}
              </a>
            </p>
            {order.customer_email && (
              <p>
                <a href={`mailto:${order.customer_email}`} className="underline">
                  {order.customer_email}
                </a>
              </p>
            )}
            <p className="mt-2 whitespace-pre-line text-muted">{order.delivery_address}</p>
            {order.notes && <p className="mt-2 whitespace-pre-line border-l-4 border-line pl-3">{order.notes}</p>}
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold">Paper</h2>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold">Their story</h2>
            {answers?.length ? (
              <dl className="mt-2 space-y-4 text-sm">
                {answers.map((a, i) => (
                  <div key={i}>
                    <dt className="font-semibold">{a.label}</dt>
                    <dd className="whitespace-pre-line">{a.value || <span className="text-muted">—</span>}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-muted">No answers.</p>
            )}
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold">Photos ({photos.length})</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((p) => (
                <a key={p.url} href={p.url} target="_blank" rel="noreferrer" download={p.name} className="block border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.name} className="aspect-square w-full object-cover" />
                  <span className="block truncate p-1 text-xs">{p.name}</span>
                </a>
              ))}
            </div>
            {photos.length > 0 && (
              <p className="mt-2 text-xs text-muted">Links expire after an hour. Reload the page for fresh ones.</p>
            )}
          </section>
        </div>

        <aside className="space-y-8">
          <form action={updateOrderStatus} className="border border-line p-4">
            <input type="hidden" name="order_id" value={order.id} />
            <h2 className="font-serif text-xl font-bold">Update status</h2>
            <select name="status" defaultValue={order.status} className="mt-3 w-full border border-line px-3 py-2 capitalize">
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <textarea name="note" rows={3} placeholder="Internal note (optional)" className="mt-3 w-full border border-line px-3 py-2 text-sm" />
            <button className="mt-3 w-full bg-ink px-4 py-2 font-semibold text-paper">Save</button>
          </form>

          <section>
            <h2 className="font-serif text-xl font-bold">History</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {events?.map((e, i) => (
                <li key={i} className="border-l-2 border-line pl-3">
                  <p className="text-xs text-muted">{new Date(e.created_at).toLocaleString("en-GB")}</p>
                  {e.from_status !== e.to_status && (
                    <p>
                      {e.from_status ? `${e.from_status} → ` : ""}
                      <strong>{e.to_status}</strong>
                    </p>
                  )}
                  {e.note && <p className="whitespace-pre-line">{e.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}
