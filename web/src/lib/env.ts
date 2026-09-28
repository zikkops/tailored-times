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
// On by default, so the deployed site has a working admin (sample data behind
// the demo login) before Supabase is connected. Set NEXT_PUBLIC_ADMIN_DEMO=0
// once the database, the secret key and the first admin user are in place: the
// real Supabase login and real orders then take over.
export const ADMIN_DEMO = process.env.NEXT_PUBLIC_ADMIN_DEMO !== "0";

// The pretend login used while ADMIN_DEMO is on. It guards nothing real: the
// data behind it is sample data, and the check below is a plain comparison.
// Never reuse these on a site with real orders.
export const DEMO_LOGIN = {
  user: process.env.DEMO_ADMIN_USER ?? "admin@gmail.com",
  password: process.env.DEMO_ADMIN_PASSWORD ?? "Testpassword",
};
export const DEMO_COOKIE = "tt_demo_admin";
