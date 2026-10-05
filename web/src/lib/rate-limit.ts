import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

// How often one visitor may use a form or try a password. The count lives in
// the database (hit_rate_limit), so every server shares it and a restart does
// not wipe it; a small in-memory count runs alongside as a backstop for when
// the database cannot be reached.
//
// Addresses and emails are hashed before they are stored, so the table holds
// no readable personal data.

export type Limit = { max: number; windowSeconds: number };

export const LIMITS = {
  order: { max: 5, windowSeconds: 10 * 60 },
  contact: { max: 3, windowSeconds: 10 * 60 },
  // Password guessing: counted per visitor and, separately, per account, so
  // one account cannot be worked on from a hundred different addresses.
  signin: { max: 10, windowSeconds: 10 * 60 },
  signinAccount: { max: 6, windowSeconds: 15 * 60 },
  signup: { max: 5, windowSeconds: 60 * 60 },
  reset: { max: 4, windowSeconds: 60 * 60 },
  adminSignin: { max: 8, windowSeconds: 10 * 60 },
} satisfies Record<string, Limit>;

export type Bucket = keyof typeof LIMITS;

const SALT = process.env.RATE_LIMIT_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "tailored-times";

const hash = (value: string) => createHash("sha256").update(`${SALT}:${value}`).digest("hex").slice(0, 32);

// The visitor's address, as far as the host in front of us reports it.
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  if (ip) return hash(ip);
  // No address (some hosts hide it): fall back to the user agent, which is
  // weak on its own but better than counting every visitor as the same one.
  return hash(`ua:${h.get("user-agent") ?? "unknown"}`);
}

export const accountKey = (email: string) => hash(`account:${email.trim().toLowerCase()}`);

// ------------------------------------------------- in-memory backstop
const memory = new Map<string, number[]>();

function memoryAllows(key: string, { max, windowSeconds }: Limit): boolean {
  const now = Date.now();
  const recent = (memory.get(key) ?? []).filter((t) => now - t < windowSeconds * 1000);
  recent.push(now);
  memory.set(key, recent);
  if (memory.size > 5000) memory.clear();
  return recent.length <= max;
}

/**
 * Counts one attempt and says whether it may go ahead.
 * `subject` is already hashed: use clientKey() or accountKey().
 */
export async function allow(bucket: Bucket, subject: string): Promise<boolean> {
  const limit = LIMITS[bucket];
  if (!memoryAllows(`${bucket}:${subject}`, limit)) return false;
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return true;

  try {
    const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
      p_bucket: bucket,
      p_subject: subject,
      p_max: limit.max,
      p_window_seconds: limit.windowSeconds,
    });
    if (error) {
      console.error("rate limit check failed", error.message);
      return true; // the memory count above already had its say
    }
    return data !== false;
  } catch (err) {
    console.error("rate limit check failed", err);
    return true;
  }
}

export const TOO_MANY_MESSAGE =
  "That is a lot of requests in a short time. Please wait a few minutes, or contact us on +961 81 587 957.";

export const TOO_MANY_SIGNIN_MESSAGE =
  "Too many attempts. Please wait a few minutes before trying again.";
