import { NextResponse } from "next/server";
import { settleWhishOrder } from "@/lib/whish-orders";

// Whish calls this with a plain GET and no body when a payment attempt ends,
// once per attempt (?ref=TT-000123, which we put on the URL ourselves).
//
// It carries no signature, and the address is public, so nothing here is
// believed: the reference only says which order to go and ask Whish about.
// settleWhishOrder does the asking, and that answer is what gets written.
// A failed attempt is not the end, either — their link stays payable — so a
// "failed" answer never closes the order on its own.

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("ref") ?? "";
  if (!/^TT-\d{4,}$/.test(reference)) {
    // Always 200: Whish retries nothing, and a noisy error here tells a
    // stranger poking at the address whether a reference exists.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    await settleWhishOrder(reference);
  } catch (e) {
    console.error("whish callback could not settle", reference, e);
  }
  return NextResponse.json({ received: true }, { status: 200 });
}
