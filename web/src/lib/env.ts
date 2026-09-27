// Supabase settings. Until .env.local is filled in (and supabase/setup.sql has
// been run), public pages fall back to the seed data in src/data, and orders,
// messages and the admin area report "not configured".

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Supabase's newer dashboards call this the "publishable" key; older ones "anon".
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Demo mode for the admin area: sample orders and messages, no login, nothing
// saved. For designing the back office before the real one exists. Must be off
// (unset) anywhere real orders live.
export const ADMIN_DEMO = process.env.NEXT_PUBLIC_ADMIN_DEMO === "1";
