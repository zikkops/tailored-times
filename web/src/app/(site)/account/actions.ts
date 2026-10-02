"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { claimPastOrders } from "@/lib/account";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// Customer sign-up, sign-in and profile editing. Customers never change an
// order here: that goes through the team (owner's decision, 2 Oct 2026).

export type AuthResult = { ok: true; message?: string } | { ok: false; error: string };

const str = (fd: FormData, key: string, max = 300) => String(fd.get(key) ?? "").trim().slice(0, max);

const NOT_READY: AuthResult = {
  ok: false,
  error: "Accounts aren't connected yet. Please contact us on +961 81 587 957.",
};

export async function signUp(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured) return NOT_READY;

  const email = str(formData, "email", 200).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const full_name = str(formData, "full_name", 200);
  const phone = str(formData, "phone", 50);

  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Please check your email address." };
  if (password.length < 8) return { ok: false, error: "Your password needs at least 8 characters." };
  if (!full_name) return { ok: false, error: "Please tell us your name." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, phone } },
  });
  if (error) return { ok: false, error: error.message };

  // With email confirmation on, there is no session until they click the link.
  if (!data.session) {
    return { ok: true, message: "Almost there: check your email and click the link to finish signing up." };
  }

  await claimPastOrders();
  redirect("/account");
}

export async function signIn(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured) return NOT_READY;

  const email = str(formData, "email", 200).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: "Wrong email or password." };

  await claimPastOrders();
  redirect("/account");
}

export async function sendReset(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured) return NOT_READY;
  const email = str(formData, "email", 200).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Please check your email address." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email);
  // Same answer either way, so the form cannot be used to find out who has an account.
  return { ok: true, message: "If that email has an account, a reset link is on its way." };
}

export async function signOutCustomer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfile(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured) return NOT_READY;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const full_name = str(formData, "full_name", 200);
  const phone = str(formData, "phone", 50);
  const address = str(formData, "address", 1000);
  if (!full_name) return { ok: false, error: "Please tell us your name." };

  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, full_name, phone, address, email: user.email ?? "" }, { onConflict: "user_id" });
  if (error) return { ok: false, error: `Couldn't save: ${error.message}` };

  revalidatePath("/account/details");
  revalidatePath("/account");
  return { ok: true, message: "Saved." };
}
