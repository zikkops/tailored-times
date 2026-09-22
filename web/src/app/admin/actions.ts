"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";


// Every action re-checks the admin role; proxy.ts only checks for a session.
// Writes go through the signed-in user's client, so RLS applies too.

export async function updateOrderStatus(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = String(formData.get("order_id"));
  const status = String(formData.get("status")) as OrderStatus;
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (!ORDER_STATUSES.includes(status)) return;

  const supabase = await createClient();
  const { data: current } = await supabase.from("orders").select("status").eq("id", orderId).single();
  if (!current) return;

  if (current.status !== status) {
    await supabase.from("orders").update({ status }).eq("id", orderId);
  }
  if (current.status !== status || note) {
    await supabase.from("order_events").insert({
      order_id: orderId,
      from_status: current.status,
      to_status: status,
      note: note || null,
      created_by: admin.id,
    });
  }
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}

export async function setMessageHandled(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("contact_messages")
    .update({ handled: formData.get("handled") === "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/messages");
}

export async function setTemplateActive(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("templates")
    .update({ active: formData.get("active") === "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/settings");
  revalidatePath("/templates");
}

export async function updateTemplate(_prev: string, formData: FormData): Promise<string> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const category = String(formData.get("category") ?? "").trim().slice(0, 100);
  const blurb = String(formData.get("blurb") ?? "").trim().slice(0, 1000);
  const sortOrder = Math.floor(Number(formData.get("sort_order")));
  if (!name || !category) return "Name and category are required.";
  if (!Number.isFinite(sortOrder)) return "Order must be a number.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .update({ name, category, blurb, sort_order: sortOrder })
    .eq("id", String(formData.get("id")));
  if (error) return `Save failed: ${error.message}`;
  revalidatePath("/", "layout");
  return "Saved.";
}

export async function savePricing(_prev: string, formData: FormData): Promise<string> {
  const admin = await requireAdmin();
  let config: PricingConfig;
  try {
    config = JSON.parse(String(formData.get("config")));
  } catch {
    return "That isn't valid JSON. Nothing was saved.";
  }
  // Every key of the default config must be present with the same type.
  for (const [k, v] of Object.entries(DEFAULT_PRICING)) {
    const got = (config as Record<string, unknown>)[k];
    if (got === undefined || typeof got !== typeof v) return `"${k}" is missing or has the wrong type. Nothing was saved.`;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("pricing").update({ config, updated_by: admin.id }).eq("id", 1);
  if (error) return `Save failed: ${error.message}`;
  revalidatePath("/", "layout");
  return "Prices saved.";
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
