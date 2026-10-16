import "server-only";

// Paying with Whish (whish-partners.pages.dev, "Whish Pay"), the second way to
// pay after cash on delivery (owner, 16 Oct 2026).
//
// Their flow: we ask for a payment and get back a `collectUrl`, we send the
// customer there, and Whish calls us back when the attempt finishes. The
// callback carries no signature and anyone could call it, so it is only a
// nudge: the order is never marked paid until we have asked Whish ourselves
// (whishStatus below). Their docs say the same.
//
// WHISH_API_URL defaults to the sandbox; set it to
// https://api.whish.money/itel-service/api once the live keys arrive.

const API = (process.env.WHISH_API_URL || "https://partner.api.sbx.whish.money/itel-service/api").replace(/\/$/, "");
const CHANNEL = process.env.WHISH_CHANNEL ?? "";
const SECRET = process.env.WHISH_SECRET ?? "";
const WEBSITE = process.env.WHISH_WEBSITE_URL ?? "";

export const isWhishConfigured = Boolean(CHANNEL && SECRET && WEBSITE);

export class WhishError extends Error {}

/** Whish answers every call with the same envelope. */
type Envelope = {
  status?: boolean;
  code?: number | string | null;
  dialog?: { message?: string } | null;
  data?: Record<string, unknown> | null;
};

export type WhishPaymentStatus = "pending" | "success" | "failed" | "refunded" | "unknown";

/**
 * USD takes at most two decimals and at least 1.00; Whish wants the amount as
 * a string, so 33.3 goes out as "33.30".
 */
export function whishAmount(price: number): string {
  if (!Number.isFinite(price) || price < 1) throw new WhishError(`Whish cannot take ${price} USD; the least is 1.00.`);
  return price.toFixed(2);
}

/**
 * Whether the envelope means the call worked. Theirs is not an HTTP status:
 * `status: false` with code 500 means "not settled yet", which must never be
 * read as a failure.
 */
export function readEnvelope(body: Envelope): { ok: boolean; pending: boolean; message: string } {
  const ok = body.status === true && (body.code === null || body.code === undefined);
  const pending = body.status === false && String(body.code) === "500";
  const message = body.dialog?.message || (body.code != null ? `code ${body.code}` : "no reason given");
  return { ok, pending, message };
}

async function call(path: string, body: Record<string, unknown>): Promise<Envelope> {
  if (!isWhishConfigured) {
    throw new WhishError("Whish isn't set up: add WHISH_CHANNEL, WHISH_SECRET and WHISH_WEBSITE_URL.");
  }
  let res: Response;
  try {
    res = await fetch(`${API}/${path}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        channel: CHANNEL,
        secret: SECRET,
        websiteurl: WEBSITE,
        "User-Agent": "TailoredTimes/1.0 (tailored-times.com; contact@tailored-times.com)",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    throw new WhishError(`Whish ${path}: could not be reached (${e instanceof Error ? e.message : String(e)})`);
  }
  // A rejected callback URL comes back as an HTML page, not JSON.
  const text = await res.text();
  let parsed: Envelope;
  try {
    parsed = JSON.parse(text) as Envelope;
  } catch {
    throw new WhishError(`Whish ${path}: ${res.status} ${text.replace(/<[^>]*>/g, " ").trim().slice(0, 300)}`);
  }
  return parsed;
}

// ------------------------------------------------------------- taking money

export type WhishPaymentRequest = {
  /** Our order reference, e.g. TT-000123. Whish replays the result if it repeats. */
  externalId: string;
  amount: number;
  invoice: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  successCallbackUrl: string;
  failureCallbackUrl: string;
};

/** Asks Whish for a payment link. Throws if it cannot be made. */
export async function createWhishPayment(req: WhishPaymentRequest): Promise<string> {
  const body = await call("payment/whish", {
    amount: whishAmount(req.amount),
    currency: "USD",
    invoice: req.invoice.slice(0, 200),
    externalId: req.externalId,
    successCallbackUrl: req.successCallbackUrl,
    failureCallbackUrl: req.failureCallbackUrl,
    successRedirectUrl: req.successRedirectUrl,
    failureRedirectUrl: req.failureRedirectUrl,
  });
  const { ok, message } = readEnvelope(body);
  const collectUrl = body.data?.collectUrl;
  if (!ok || typeof collectUrl !== "string" || !collectUrl) {
    throw new WhishError(`Whish would not start the payment: ${message}`);
  }
  return collectUrl;
}

/**
 * What Whish says about a payment. This is the only thing that may mark an
 * order paid: the callback is unauthenticated, so it is never trusted on its
 * own. Anything unsettled comes back as "pending" so nothing is written off.
 */
export async function whishStatus(externalId: string): Promise<WhishPaymentStatus> {
  const body = await call("payment/collect/status", { currency: "USD", externalId });
  const { ok, pending } = readEnvelope(body);
  if (pending) return "pending";
  if (!ok) return "unknown";
  const status = String(body.data?.collectStatus ?? "").toLowerCase();
  if (status === "success" || status === "failed" || status === "refunded" || status === "pending") return status;
  return "unknown";
}
