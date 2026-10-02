import "server-only";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import type { OrderStatus } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

// The customer side of the account area. Everything here runs as the signed-in
// person, so Supabase's own rules decide what they can see: their profile and
// their orders, nothing else.

export type Profile = {
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
};

export type MyOrder = {
  id: string;
  reference: string;
  template_name: string;
  format: string;
  size: string;
  pages: number;
  copies: number;
  frames: boolean;
  designer: boolean;
  price: number;
  currency: string;
  status: OrderStatus;
  payment_method: string;
  delivery_address: string;
  notes: string | null;
  created_at: string;
};

export type Customer = { id: string; email: string; profile: Profile | null };

export async function getCustomer(): Promise<Customer | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  return { id: user.id, email: user.email ?? "", profile: (profile as Profile) ?? null };
}

export async function requireCustomer(): Promise<Customer> {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login");
  return customer;
}

// Orders placed before signing up, with the same email, become theirs.
export async function claimPastOrders(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_orders");
  if (error) {
    console.error("claim_orders failed", error.message);
    return 0;
  }
  return Number(data ?? 0);
}

export async function listMyOrders(): Promise<MyOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, reference, template_name, format, size, pages, copies, frames, designer, price, currency, status, payment_method, delivery_address, notes, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listMyOrders failed", error.message);
    return [];
  }
  return (data ?? []) as MyOrder[];
}

export async function getMyOrder(id: string) {
  const supabase = await createClient();
  const [{ data: order }, { data: answers }, { data: events }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_answers").select("label, value").eq("order_id", id).order("id"),
    supabase
      .from("order_events")
      .select("from_status, to_status, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!order) return null;
  return {
    order: order as MyOrder,
    answers: (answers ?? []) as { label: string; value: string }[],
    events: (events ?? []) as { from_status: OrderStatus | null; to_status: OrderStatus; created_at: string }[],
  };
}
