import "server-only";

// Delivery through Wakilni (wiki.wakilni.com/integrations/api).
//
// Their flow: get a token from the app key/secret, open a "bulk" (a pickup
// from us), add a delivery to it (the customer), then close the bulk, which
// sends it to their team. We do one bulk per order, when the order is moved
// to 'delivering' in the admin (owner decision, 15 Oct 2026).
//
// WAKILNI_API_URL defaults to the test server; set it to
// https://api.wakilni.com once we go live with a production key.

const API = (process.env.WAKILNI_API_URL || "https://api-dev.wakilni.com").replace(/\/$/, "");
const KEY = process.env.WAKILNI_KEY ?? "";
const SECRET = process.env.WAKILNI_SECRET ?? "";

export const isWakilniConfigured = Boolean(KEY && SECRET);

export class WakilniError extends Error {}

type Json = Record<string, unknown>;

async function call(path: string, init: RequestInit & { token?: string } = {}): Promise<Json> {
  const { token, ...rest } = init;
  const res = await fetch(`${API}/api/v2/${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => ({}))) as Json;
  if (!res.ok) {
    const detail = typeof body.message === "string" ? body.message : res.statusText;
    const errors = body.errors ? ` ${JSON.stringify(body.errors)}` : "";
    throw new WakilniError(`Wakilni ${path.split("/").slice(0, 2).join("/")}: ${res.status} ${detail}${errors}`.slice(0, 1000));
  }
  return body;
}

// The docs show the key and secret as a GET body; fetch can't send one, and
// their API reads query parameters the same way.
async function authToken(): Promise<string> {
  if (!isWakilniConfigured) throw new WakilniError("Wakilni isn't set up: add WAKILNI_KEY and WAKILNI_SECRET.");
  const qs = new URLSearchParams({ key: KEY, secret: SECRET });
  const body = await call(`third_party/auth_token?${qs}`, { method: "GET" });
  if (typeof body.token !== "string") throw new WakilniError("Wakilni sent no auth token.");
  return body.token;
}

// ------------------------------------------------------------------ areas

// Wakilni's area names, for the picker at checkout. Kept for a day per server;
// an empty list (not set up, or Wakilni down) lets people type their area.
let areaCache: { at: number; names: string[] } | null = null;
const AREA_TTL = 24 * 60 * 60 * 1000;

export async function getWakilniAreas(): Promise<string[]> {
  if (!isWakilniConfigured) return [];
  if (areaCache && Date.now() - areaCache.at < AREA_TTL) return areaCache.names;
  try {
    const body = await call("areas", { method: "GET", token: await authToken() });
    const names = areaNames(body);
    if (names.length) areaCache = { at: Date.now(), names };
    return names;
  } catch (e) {
    console.error("Wakilni areas failed", e);
    return areaCache?.names ?? [];
  }
}

// The list comes back either bare or under `data`; each area has a `name`.
export function areaNames(body: unknown): string[] {
  const list = Array.isArray(body) ? body : Array.isArray((body as Json)?.data) ? ((body as Json).data as unknown[]) : [];
  const names = list
    .map((a) => (typeof a === "string" ? a : (a as Json)?.name))
    .filter((n): n is string => typeof n === "string" && n.trim() !== "")
    .map((n) => n.trim());
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

// --------------------------------------------------------------- delivery

export type DeliveryOrder = {
  reference: string; // TT-000123
  template_name: string;
  copies: number;
  frames: boolean;
  price: number;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  delivery_area: string | null;
};

// The delivery as Wakilni wants it. Wakilni asks for numeric ids for the
// receiver and their location; the order number (123 in TT-000123) is ours and
// unique, so it serves for both.
export function deliveryPayload(o: DeliveryOrder) {
  const number = Number(o.reference.replace(/\D/g, ""));
  const [first, ...rest] = o.customer_name.trim().split(/\s+/);
  const cod = o.payment_method === "cod";
  return {
    get_order_details: false,
    get_barcode: false,
    waybill: o.reference,
    receiver_id: number,
    receiver_first_name: first,
    receiver_last_name: rest.join(" ") || first,
    receiver_phone_number: o.customer_phone,
    ...(o.customer_email ? { receiver_email: o.customer_email } : {}),
    receiver_location_id: number,
    receiver_area: o.delivery_area ?? "",
    receiver_directions: o.delivery_address,
    currency: 1, // USD
    cash_collection_type_id: cod ? 52 : 54, // 52 = collect on delivery, 54 = already paid
    collection_amount: cod ? o.price : 0,
    note: `Tailored Times ${o.reference}: ${o.template_name} newspaper`,
    packages: [
      {
        quantity: o.copies,
        type_id: o.frames ? 58 : 57, // framed papers go in a box, others as paper
        name: `${o.template_name} newspaper${o.frames ? " (framed)" : ""}`,
        sku: o.reference,
      },
    ],
  };
}

// Where Wakilni's driver picks the papers up: our own location, from settings.
function pickupPayload() {
  const num = (v: string | undefined) => (v && Number.isFinite(Number(v)) ? Number(v) : undefined);
  return {
    location_id: num(process.env.WAKILNI_PICKUP_LOCATION_ID) ?? 1,
    area: process.env.WAKILNI_PICKUP_AREA ?? "",
    ...(num(process.env.WAKILNI_PICKUP_LATITUDE) !== undefined ? { latitude: num(process.env.WAKILNI_PICKUP_LATITUDE) } : {}),
    ...(num(process.env.WAKILNI_PICKUP_LONGITUDE) !== undefined ? { longitude: num(process.env.WAKILNI_PICKUP_LONGITUDE) } : {}),
    ...(num(process.env.WAKILNI_PICKUP_FLOOR) !== undefined ? { floor: num(process.env.WAKILNI_PICKUP_FLOOR) } : {}),
  };
}

export type SentDelivery = { orderId: number | null; trackingId: string | null; trackingUrl: string | null };

// Hands one order to Wakilni: open a bulk, add the delivery, close the bulk.
export async function sendToWakilni(order: DeliveryOrder): Promise<SentDelivery> {
  const token = await authToken();
  const bulk = await call("clients/start_bulk", { method: "POST", token, body: JSON.stringify(pickupPayload()) });
  const bulkId = bulk.bulk_id;
  if (bulkId === undefined || bulkId === null) throw new WakilniError("Wakilni opened no bulk.");

  const added = await call(`clients/add_delivery/${bulkId}`, {
    method: "POST",
    token,
    body: JSON.stringify(deliveryPayload(order)),
  });
  await call(`clients/end_bulk/${bulkId}`, { method: "POST", token });

  return {
    orderId: Number.isFinite(Number(added.delivery_id)) ? Number(added.delivery_id) : null,
    trackingId: typeof added.tracking_id === "string" ? added.tracking_id : null,
    trackingUrl: typeof added.tracking_url === "string" ? added.tracking_url : null,
  };
}
