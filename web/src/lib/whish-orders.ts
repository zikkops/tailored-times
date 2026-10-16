import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { whishStatus, type WhishPaymentStatus } from "@/lib/whish";

// Asking Whish how an order's payment ended, and writing the answer down.
//
// Both the callback and the confirmation page come through here, so a customer
// who closes the tab before Whish calls us still has their order settled the
// moment they look at it. Whish replays a settled answer for the same
// reference, so asking twice is free and always gives the same result.

const STATE: Record<WhishPaymentStatus, "pending" | "paid" | "failed" | "refunded"> = {
  pending: "pending",
  unknown: "pending", // not settled: never write it off
  success: "paid",
  failed: "failed",
  refunded: "refunded",
};

export type SettleResult = { state: "pending" | "paid" | "failed" | "refunded" | "unchanged"; reference: string };

/**
 * Asks Whish about one order and saves what it says. Orders that are not
 * waiting on Whish, and ones already paid, are left exactly as they are.
 */
export async function settleWhishOrder(reference: string): Promise<SettleResult> {
  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, reference, status, payment_method, payment_state")
    .eq("reference", reference)
    .maybeSingle();

  if (!order || order.payment_method === "cod") return { state: "unchanged", reference };
  if (order.payment_state === "paid" || order.payment_state === "refunded") {
    return { state: order.payment_state, reference };
  }

  const answer = await whishStatus(reference);
  const state = STATE[answer];
  const now = new Date().toISOString();

  // A failed attempt leaves their link payable, so it is recorded without
  // closing anything; the team decides what to do with it.
  await db
    .from("orders")
    .update({
      payment_state: state,
      whish_checked_at: now,
      whish_error: state === "failed" ? "Whish reported a failed attempt" : null,
    })
    .eq("id", order.id);

  if (state !== order.payment_state) {
    await db.from("order_events").insert({
      order_id: order.id,
      from_status: order.status,
      to_status: order.status,
      note: state === "paid" ? "Paid through Whish" : `Whish payment ${state}`,
    });
  }

  return { state, reference };
}
