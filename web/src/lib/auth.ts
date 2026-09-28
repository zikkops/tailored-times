import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_ADMIN } from "@/lib/demo";
import { ADMIN_DEMO, DEMO_COOKIE, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string; role: "owner" | "admin" };

// Returns the signed-in admin, or null. Checks the `admins` table on every
// call; proxy.ts only does the cheap "is there a session" redirect.
export async function getAdmin(): Promise<AdminUser | null> {
  if (ADMIN_DEMO) return (await cookies()).has(DEMO_COOKIE) ? DEMO_ADMIN : null;
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  if (!data) return null;
  return { id: user.id, email: user.email ?? "", role: data.role };
}

// For admin pages and admin server actions.
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
