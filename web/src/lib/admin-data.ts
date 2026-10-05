import "server-only";

import { ADMIN_DEMO } from "@/lib/env";
import {
  DEMO_ANSWERS,
  DEMO_EVENTS,
  DEMO_MESSAGES,
  DEMO_ORDERS,
  DEMO_PHOTO_COUNT,
  type DemoOrder,
} from "@/lib/demo";
import { TEMPLATES } from "@/data/templates";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Everything the admin pages read. In demo mode (ADMIN_DEMO=1) it answers from
// src/lib/demo.ts so the back office can be designed without a database;
// otherwise it reads Supabase, where RLS still limits it to admins.

export type AdminOrder = DemoOrder;

export type OrderDetail = {
  order: AdminOrder;
  answers: { label: string; value: string }[];
  photos: { url: string; name: string; label: string }[];
  events: { from_status: OrderStatus | null; to_status: OrderStatus; note: string | null; created_at: string }[];
};

export type AdminMessage = (typeof DEMO_MESSAGES)[number];

const matches = (o: AdminOrder, q: string) =>
  [o.reference, o.customer_name, o.customer_phone].join(" ").toLowerCase().includes(q.toLowerCase());

export async function listOrders({ status = "", q = "" }): Promise<{ orders: AdminOrder[]; error?: string }> {
  if (ADMIN_DEMO) {
    let orders = [...DEMO_ORDERS];
    if (status) orders = orders.filter((o) => o.status === status);
    if (q) orders = orders.filter((o) => matches(o, q));
    return { orders };
  }

  const supabase = await createClient();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  if (q) {
    // Only plain characters reach the filter: a comma, bracket, quote or
    // backslash would otherwise be read as part of the query, not the search.
    const like = `%${q.replace(/[^\p{L}\p{N} .@+-]/gu, "").slice(0, 80)}%`;
    query = query.or(`reference.ilike.${like},customer_name.ilike.${like},customer_phone.ilike.${like}`);
  }
  const { data, error } = await query;
  return { orders: (data ?? []) as AdminOrder[], error: error?.message };
}

// Counts for the dashboard tiles, over every order (not the filtered list).
export async function orderStats() {
  const { orders } = await listOrders({});
  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  let openValue = 0;
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    if (o.status !== "delivered" && o.status !== "cancelled") openValue += Number(o.price);
  }
  const thisMonth = orders.filter((o) => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && o.status !== "cancelled";
  });
  return {
    total: orders.length,
    byStatus,
    openValue,
    monthCount: thisMonth.length,
    monthValue: thisMonth.reduce((sum, o) => sum + Number(o.price), 0),
  };
}

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  if (ADMIN_DEMO) {
    const order = DEMO_ORDERS.find((o) => o.id === id);
    if (!order) return null;
    const count = DEMO_PHOTO_COUNT[id] ?? 0;
    // Stand-in pictures so the layout can be judged: the template's own pages.
    const photos = Array.from({ length: count }, (_, i) => ({
      url: `/templates/birthday/${(i % 4) + 1}.jpg`,
      name: `customer-photo-${i + 1}.jpg`,
      label: `${i + 1}. Photo`,
    }));
    return { order, answers: DEMO_ANSWERS[id] ?? [], photos, events: DEMO_EVENTS[id] ?? [] };
  }

  const supabase = await createClient();
  const [{ data: order }, { data: answers }, { data: files }, { data: events }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_answers").select("label, value").eq("order_id", id).order("id"),
    supabase.from("order_files").select("field_key, storage_path, original_name").eq("order_id", id).order("id"),
    supabase
      .from("order_events")
      .select("from_status, to_status, note, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!order) return null;

  // Photos live in a private bucket: hand out short-lived signed links.
  let photos: OrderDetail["photos"] = [];
  if (files?.length) {
    const { data: signed } = await createAdminClient()
      .storage.from("order-uploads")
      .createSignedUrls(files.map((f) => f.storage_path), 60 * 60);
    photos = (signed ?? []).flatMap((s, i) =>
      s.signedUrl
        ? [{ url: s.signedUrl, name: files[i].original_name ?? `photo ${i + 1}`, label: files[i].field_key ?? "Photo" }]
        : [],
    );
  }

  return {
    order: order as AdminOrder,
    answers: (answers ?? []) as { label: string; value: string }[],
    photos,
    events: (events ?? []) as OrderDetail["events"],
  };
}

export async function listMessages(): Promise<{ messages: AdminMessage[]; error?: string }> {
  if (ADMIN_DEMO) {
    const messages = [...DEMO_MESSAGES].sort(
      (a, b) => Number(a.handled) - Number(b.handled) || +new Date(b.created_at) - +new Date(a.created_at),
    );
    return { messages };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("handled")
    .order("created_at", { ascending: false })
    .limit(200);
  return { messages: (data ?? []) as AdminMessage[], error: error?.message };
}

export type AdminTemplate = {
  id: string;
  slug: string;
  name: string;
  category: string;
  blurb: string;
  sort_order: number;
  active: boolean;
};

export async function listAdminTemplates(): Promise<AdminTemplate[]> {
  if (ADMIN_DEMO) {
    return TEMPLATES.map((t, i) => ({
      id: t.slug,
      slug: t.slug,
      name: t.name,
      category: t.category,
      blurb: t.blurb,
      sort_order: i + 1,
      active: true,
    }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("templates")
    .select("id, name, slug, category, blurb, sort_order, active")
    .order("sort_order");
  return (data ?? []) as AdminTemplate[];
}
