# Tailored Times

Rebuild of https://tailored-times.com (WordPress/Elementor/Formidable) as a
Next.js 16 app with a Supabase back end. Custom newspaper keepsakes: pick a
template, choose format/size/pages/copies/frame, fill in stories and photos,
cash on delivery.

- **Plan and task list:** `UPGRADE.md`. Work top-down, tick tasks when done.
- **Project notes:** AI brain vault, `C:\Users\User\Documents\ai brain\01 - Projects\Tailored Times\`.
  When a task lands, update the vault note and page notes to match.
- **App:** `web/` (see `web/AGENTS.md`: Next 16 has breaking changes; read
  `web/node_modules/next/dist/docs/` before writing code. Middleware is now `proxy.ts`,
  `params` is a Promise).

## Commands (run in `web/`)

- `npm run dev`: local site at http://localhost:3000
- `npm test`: Vitest (the price calculator must keep matching the live site)
- `npm run lint`, `npm run build`: run both before calling a task done
- `npm run db:seed-sql`: regenerate `supabase/seed.sql` from `src/data/templates.ts` and `DEFAULT_PRICING`
- `npm run db:setup-sql`: regenerate `supabase/setup.sql` (all migrations + seed, pasted into the Supabase SQL editor on a fresh project)

## Rules

- The price is always recalculated on the server (`src/lib/pricing.ts`). Never trust a price from the browser.
- Public pages never write to tables from the browser. Orders and contact messages go through server
  actions using the service-role client (`src/lib/supabase/admin.ts`), after validating input.
- Every admin server action re-checks that the user is in `admins`, even behind `proxy.ts`.
- Order statuses: `ordered` → `created` → `printing` → `delivering` → `delivered` (+ `cancelled`).
- Payment is cash on delivery only (`payment_method = 'cod'`).
- Not hosted yet. Never push or deploy without being asked.
