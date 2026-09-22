# Tailored Times: rebuild plan

Rebuilding https://tailored-times.com as a **Next.js front end + Supabase back end**,
with an admin login where the team sees the orders. Written 21 Sep 2026 from a
read-only audit of the live site. Phase 1–2 code started the same day in `web/`.

Project notes live in the AI brain vault at
`C:\Users\User\Documents\ai brain\01 - Projects\Tailored Times\`
(main note, Pages, Open Questions). When a task here finishes, update the vault
to match.

The owner's goals, in order:

1. Recreate the current site as it is: every page, the price calculator, the
   order flow. **Visuals get fixed later**, so the first pass copies the content
   and the behaviour, not the styling.
2. Put everything on Supabase: orders, templates, prices, contact messages,
   uploaded photos.
3. An admin login so staff can see and manage orders.
4. Fix the inconsistencies listed below.
5. Then make the site better (Phase 5 onwards).

## How to use this file

- Work top-down. Each phase needs the one before it.
- **Each task is one session.** If a task grows, split it here before starting.
- **(owner)** marks a task that needs the owner's answer first. Ask, write the
  answer next to the task, then build.
- Tick `[x]` and add one line on what was done when a task finishes.
- Every task ends with `npm run lint` and `npm run build`. For anything the
  customer sees, open it in a browser at phone width (360px) and desktop width.
- Next.js 16 has breaking changes. Read `node_modules/next/dist/docs/` before
  writing code, as in the sibling project `C:\Projects\Event image location`.

---

## What the current site is (audit, 21 Sep 2026)

**Stack:** WordPress, Hello Elementor theme, Elementor Pro, WooCommerce,
Formidable Forms Pro, All in One SEO. WooCommerce is installed but has **no
products**. Orders are actually **Formidable form entries**, one form per
template.

**Contact details** (header/footer): contact@tailored-times.com,
+961 81 587 957, Instagram `tailored.times`, a Facebook page.

**Brand:** Elementor global colours `#0D0C1D` (primary, near-black navy),
`#17152F`, `#0C0B1F`, `#F0EBEB`, `#DBD8D8`, `#C7C2C2`, text `#7A7A7A`.
The fonts are inconsistent. The globals say Roboto and Roboto Slab, but the pages
load Inter and Cardo. Logo: `wp-content/uploads/2025/05/5x5-Logo.png`.

### Pages

| Route | What it is | Rebuild? |
|---|---|---|
| `/` | Home: hero "Make Headlines That Matter", "What's in the paper", "Why us", a 6-step how-to (template, format, size, frame, customise, delivery), custom-design offer, testimonials | Yes |
| `/template-gallery/` | Grid of 15 templates, each with a title, blurb and "Customize" button | Yes |
| `/<name>-template/` (15 pages) | Template page: title, blurb, preview images, a **price calculator**, then a multi-page **order form** | Yes, as one dynamic route |
| `/contact-us/` | Contact form: name (first, last), email, subject, message, honeypot | Yes |
| `/test-calculator/`, `/trial-form/`, `/template-page/` | Test and placeholder pages (lorem ipsum, "Please select a valid form") | **No, drop** |
| `/shop/`, `/cart/`, `/checkout/`, `/my-account/` | Unused WooCommerce pages | **No, drop** |

Templates (slug → gallery name): `birthday-template` (Birthday 1),
`birthday-template-2` (Birthday 2), `anniversary-template`,
`retirement-template`, `mothers-day-template` (Mother's / Father's day),
`summer-camp-template`, `menu-template`, `christan-wedding-template`
(Wedding 1), `muslim-wedding-template` (Wedding 2), `basketball-tribute`,
`events-template`, `baby-shower-template`, `corporate-template`,
`fashion-magazine-template`, `promotion-template`.

### Price calculator (the current formula, copied from the live page)

Inputs: format (Hard copy / Digital copy / Cover page), size (Tabloid
33×24 cm / Broadsheet 50×35.7 cm), pages (1, 4, 8, 12, 16, 20, 24), copies,
frames (yes/no), designer needed (yes/no). Currency: USD.

```
Digital copy:   20, plus 20 if a designer is needed.
Otherwise:
  pages = 1 if format is "Cover page"
  qty   = copies × pages
  price = qty × unitPrice(size, qty)
  unitPrice Tabloid:    ≤5 1.08 | ≤10 1.00 | ≤25 0.88 | ≤50 0.79 | ≤100 0.75 | ≤250 0.70 | else 0.65
  unitPrice Broadsheet: ≤5 3.25 | ≤10 3.15 | ≤25 3.05 | ≤50 2.60 | ≤100 2.85 | else 2.60
  frames yes: + copies × frame(T 7.5 / B 15.5) + ceil(copies/4) × box(T 1.4 / B 3.3)
  frames no:  qty < 13 ? + envelope(T 1.4 / B 2.7) : + ceil(qty/50) × box
  price = price × 1.11 + 5
  r = ceil(price)
  r ≥ 11: price += 22 + floor((r − 11)/10) × 2
  r = 10: price ×= 3.00 | r = 9: ×= 3.11 | r = 8: ×= 3.38
  designer yes: + 20
  final = round to 0.1
```

The calculator copies its results into hidden "… final" fields on the
Formidable form by matching label text. After that come about 40 more fields on
later form pages (item_meta 149–196), which hold the customer's stories, photos
and contact details. **Those field definitions cannot be seen from outside.
Export them from WordPress (see P0.2).**

---

## Current state (21 Sep 2026, end of session)

- The whole site and admin area are built and run locally (`cd web && npm run dev` → http://localhost:3000). Lint, tests and build pass.
- **Blocking go-live:** (1) run `web/supabase/setup.sql` in the Supabase SQL editor; (2) ~~wrong service key~~ fixed 21 Sep, the secret key works; (3) create the first admin user (instructions at the end of setup.sql). `setup.sql` is now generated: `npm run db:seed-sql && npm run db:setup-sql`.
- Until then, public pages show the built-in template/price data and ordering replies "isn't connected yet".
- Step-2 order fields are placeholders until read from the live forms in Chrome (P0.2).
- **Visuals copied from the live site (22 Sep):** logo (`public/brand/logo.png`), dark-band pattern, home collage and step photos (`public/home/`), fonts Blenda Script (headings), Bauhaus (menu/body), Roboto (buttons). Layouts of header, footer, home, gallery (hover overlay), template page (slider + calculator card) and contact match the live pages. Compared by screenshot at 1440px and 390px. Hero extras (owner, 22 Sep): the cover wall drifts with the cursor and slides down up to 20% of the hero height while scrolling (`HeroCollage.tsx`; off with reduced motion). Covers fill their boxes at the real page ratio. "How to do it" (22 Sep, v3): timeline layout, text and photo on opposite sides of a 160px middle channel, sides alternating. One S-curved line flows down the channel (left edge on phones). Its tip is drawn to the point 70% down the screen, trailing the scroll slightly so it glides; each step fades/slides in with the scroll as the tip passes its dot (scrubbed, rewinds on scroll up). `StepsFlow.tsx` (GSAP ticker + ScrollTrigger refresh); tuning: TIP, REVEAL, FOLLOW. Reduced motion shows everything static. Section banners (22 Sep): newspaper-masthead style (`components/Masthead.tsx`): small-caps "THE TAILORED TIMES · SECTION X" line, double rule, script title, hairline, subtitle; used for all five home banners incl. Talk of the Town. Text sections (22 Sep, owner chose "newspaper article"): the three grey boxes became `Article` blocks in `(site)/page.tsx`: small-caps kicker, centred script headline, double rule, drop cap; text of 250+ characters flows into two ruled columns, shorter text sits in one centred column. Testimonials (22 Sep): each review is a newspaper clipping taped to the band (off-white, tilted, "Letters to the Editor" header, pull-quote headline, Old Standard TT serif with drop cap, signed byline); new font token `font-news`. Reviews live in `REVIEWS` in `components/Testimonials.tsx`. Carousel (22 Sep): 2 clippings on desktop, 1 on phones; arrows, dots, keyboard arrows and swipe, wraps at both ends. ⚠️ 4 of the 5 reviews are samples written by Claude (signed "Sample review") and the 5th is the live site placeholder: replace all with real reviews before launch (I8). Header (22 Sep): sticky; dark top strip (tagline + phone), logo, section-bar menu in small caps with hairline dividers and a sliding underline on hover/current page, dark "Start your paper" button; phones get a Menu button with a drop-down (`components/SiteHeader.tsx`). No rule under the header (owner). Template gallery (22 Sep): newspaper-style page header, covers mounted on a white mat that lifts on hover, category + name (news serif) + 2-line blurb + "Customize →"; 2 columns on phones (page 11,800px → 4,000px). `components/TemplateGallery.tsx`. No category filter (owner removed it, 22 Sep). Order form (22 Sep): newspaper style: off-white card with "Order form · Price calculator" header and double rule, progress line with ✓ for done steps, option buttons instead of drop-downs, −/+ copies stepper, small-caps labels, receipt-style total with dotted leader. Paper choices are sent as hidden inputs from state; server still recalculates.
- ⚠️ **Font licence (owner):** Blenda Script (Seniors Studio) and Bauhaus ("Duplication prohibited") are commercial fonts copied from the WordPress uploads (`web/src/fonts/`). Confirm the licence covers web use on the new site before launch, or swap them.

- **GitHub (22 Sep):** pushed to https://github.com/zikkops/tailored-times (public, `main`). Fonts are gitignored (`web/.gitignore`) because the repo is public; `README.md` explains how to add them. Since 22 Sep the licensed fonts load from `web/public/fonts/` via CSS when present, with free lookalikes (Lobster for Blenda Script, Comfortaa for Bauhaus) as fallback, so builds (e.g. Vercel, root directory `web`) never fail without them.

## Phase 0: Gather what the public site can't show

- [x] **P0.1 (owner) Answer the open questions.** *Answered 21 Sep 2026:*
  - **Payment:** cash on delivery only, for now. No online payment at launch.
    Store `payment_method = 'cod'` on every order; keep the column so more
    methods can be added later.
  - **Order statuses (in order):** `ordered` → `created` → `printing` →
    `delivering` → `delivered`. Add `cancelled` as an admin-only extra
    (confirm with owner when building P4.3).
  - **Admin access:** only specific invited users. No public sign-up; the
    owner adds them. Single role is enough to start (keep the `role` column).
  - **Prices:** keep the current formula and numbers exactly as they are,
    including the Broadsheet 51–100 tier. They must be editable from the admin
    back end (P4.5), not hard-coded.
  - **Hosting:** not now. Run locally only; deployment is decided later
    (Phase 5 is on hold).
  - Still open: currency (assume USD), delivery area/fee (assume Lebanon,
    free), where new-order notifications go: *owner, 21 Sep: email to contact@tailored-times.com for now.*

  Original questions, kept for reference:
  - Is the price formula above correct? In particular, Broadsheet 51–100 costs
    **more** per unit (2.85) than 26–50 (2.60). Is that a typo?
  - How do customers pay today (cash on delivery, Whish, OMT, card)? The home
    page says "choose your payment method". Do we take online payment at launch?
  - Is USD the only currency? Is delivery Lebanon only and always free?
  - Order statuses the team uses (e.g. new → in design → awaiting approval →
    printing → out for delivery → delivered / cancelled)?
  - Who needs admin access, and do they need different rights (owner vs. designer)?
  - Where do order notifications go today (email, WhatsApp)?
  - Keep the domain and email on the current host, or move? Where to host
    Next.js (Vercel is the default)?
- [ ] **P0.2 Export from WordPress admin** into `wp-export/` (project root).
  Owner, 21 Sep: the Formidable forms are only step 2 of the order (customer
  content after the calculator). Readable by clicking Next on a template page
  in a real browser; plain HTTP requests are blocked by the form's anti-spam token.
  - Formidable → Import/Export → all forms (XML): the full field lists per template.
  - Formidable entries (CSV): the existing orders and contact messages, for migration.
  - Media library: all images under `wp-content/uploads/` (template previews,
    logo, home imagery). About 130 are referenced on the home and template pages.
  - Elementor page JSON for home and gallery (optional, speeds up the copy).
- [ ] **P0.3 Content snapshot.** Save the text of every kept page to
  `content/` (project root) as Markdown (home, gallery, 15 templates, contact), so the
  rebuild has one source of copy. The WP REST API serves it:
  `https://tailored-times.com/wp-json/wp/v2/pages?per_page=100`.

## Phase 1: Project setup

- [x] **P1.1 Scaffold** `web/` with `create-next-app`: TypeScript, App Router,
  Tailwind, ESLint, `src/` dir. Match the versions in `Event image location`.
  `git init` at the project root, with `.env.local` in `.gitignore`.
  *Done 21 Sep: `web/` on Next 16.3.4, React 19.2, Tailwind v4, Vitest. Git initialised at the root (nothing committed yet).*
- [ ] **P1.2 Supabase project.** Create it, then add `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (server only)
  to `.env.local` and an `.env.example`. Install `@supabase/supabase-js` and
  `@supabase/ssr`. Add `lib/supabase/{client,server,admin}.ts`.
  *Code side done 21 Sep: `src/lib/env.ts`, `src/lib/supabase/{client,server,admin}.ts`, `.env.example`. Still to do: create the project in the Supabase dashboard, fill `web/.env.local`, run the migration and then `seed.sql` in the SQL editor.*
- [x] **P1.3 Project docs.** Write `CLAUDE.md` / `AGENTS.md` with the stack, the
  commands and the "read the Next 16 docs" rule, and link this file.
  *Done 21 Sep: root `CLAUDE.md` (commands, rules, vault link) plus `web/AGENTS.md` from create-next-app.*

**Back-end decision:** the "Node backend" is Next.js route handlers and server
actions, which run on Node. That means one deploy and one codebase. Move to a
separate Node/Express service only if something needs a long-running worker
(e.g. PDF generation). Anything that writes to the database or calculates a
price runs on the server.

## Phase 2: Supabase back end

- [x] **P2.1 Schema** in `supabase/migrations/`:
  - `templates`: slug, name, blurb, category, sort order, active, preview
    image paths, `form_schema` (JSON: the customisation fields for that template).
  - `pricing`: one row per config (unit-price tiers, frame, box, envelope,
    markup, designer fee, digital price). The formula reads this table, so
    prices change without a deploy.
  - `orders`: reference number (e.g. `TT-000123`), template, format, size,
    pages, copies, frames, designer, **server-calculated** price, status,
    customer name, phone, email, address, payment method, notes, created and
    updated timestamps.
  - `order_answers`: order, field key, value (the customisation content).
  - `order_files`: order, storage path, original name (the uploaded photos).
  - `order_events`: status changes and admin notes (who, when, what).
  - `contact_messages`: name, email, subject, message, handled flag.
  - `admins`: user id → role (`owner`, `staff`).
  *Done 21 Sep: `web/supabase/migrations/0001_init.sql`. Pricing is one JSON row (`pricing.config`) matching `PricingConfig`. Order refs look like `TT-000001`. Not applied yet: no Supabase project exists.*
- [x] **P2.2 Row Level Security.** The public can insert orders and messages
  only through server actions using the service role, never directly. Only
  users in `admins` can read orders. Storage bucket `order-uploads` is private,
  and admins view files through signed URLs.
  *Done 21 Sep in the same migration: `is_admin()` helper, admin-only policies, no anon writes, private `order-uploads` bucket.*
- [x] **P2.3 Seed** templates (15) and pricing from the audit above.
  *Done 21 Sep: `npm run db:seed-sql` writes `web/supabase/seed.sql` from `src/data/templates.ts` and `DEFAULT_PRICING`.*
- [x] **P2.4 Price function** `lib/pricing.ts`: one pure function used by both
  the calculator UI and the server. Write a test table that pins today's
  prices for about 20 input combinations, so the port provably matches the
  live site.
  *Done 21 Sep: `web/src/lib/pricing.ts`. `pricing.test.ts` checks it against the live formula over 3,000+ combinations, passing.*

## Phase 3: Recreate the public site (content and behaviour, plain styling)

- [x] **P3.1 Layout:** header (Home, Templates, Contact), footer (email,
  phone, Instagram, Facebook), logo, the brand colours as CSS tokens.
  *Done 21 Sep: `(site)/layout.tsx`, `SiteHeader`, `SiteFooter`, brand colours as Tailwind tokens, Inter + Cardo fonts.*
- [x] **P3.2 Home page**: all sections, in order, with the same copy.
  *Done 21 Sep: all sections, same copy, with the audit fixes (no Art exhibition, real limits, testimonial once, no "Click here").*
- [x] **P3.3 Template gallery** `/templates`, read from `templates`.
  *Done 21 Sep: `/templates`, reads Supabase, falls back to `src/data/templates.ts`. Preview images added 21 Sep: 59 page previews copied from the live site into `web/public/templates/<slug>/` (cover first), served through `next/image`.*
- [x] **P3.4 Template page** `/templates/[slug]`: title, blurb, previews and the
  price calculator (live total).
  *Done 21 Sep: `/templates/[slug]` with the live calculator (`OrderForm` step 1).*
- [x] **P3.5 Order flow**: calculator → customisation fields (from
  `form_schema`) → photo upload → contact and delivery details → review →
  submit. The server action recalculates the price, saves the order and files,
  and shows a confirmation with the order reference.
  *Built 21 Sep: 3 steps (calculator, story, delivery), `createOrder` server action recalculates the price, saves answers and photos, confirmation at `/order/success`. ⚠️ Step 2 uses placeholder fields (`DEFAULT_FORM_SCHEMA` in `src/lib/data.ts`) until the real Formidable step-2 fields are read in Chrome. Not tested end to end: Supabase tables and the secret key aren't set up yet.*
- [x] **P3.6 Contact page** saving to `contact_messages`, with a honeypot and
  rate limiting.
  *Done 21 Sep: `/contact` + `sendContactMessage` with honeypot. Rate limiting not added yet.*
- [x] **P3.7 Redirects** from every old WordPress URL (`/birthday-template/`
  etc.) to the new routes, with 301s in `next.config.ts`, so existing links and
  Google results keep working.
  *Done 21 Sep in `web/next.config.ts`, driven by `legacySlug` in the templates data.*
- [x] **P3.8 Notifications**: email the team (and the customer) on a new order.
  Use a Supabase trigger or Resend from the server action.
  *Done 21 Sep (team only): `src/lib/notify.ts` emails contact@tailored-times.com through Resend after each order (sent with `after()`, so it never slows or fails the order). Off until `RESEND_API_KEY` is set. Resend's test sender only delivers to the Resend account's own address until tailored-times.com is verified there; then set `NOTIFY_EMAIL_FROM`. Customer confirmation emails not added.* *Owner, 21 Sep: Resend parked for now. The code stays in place and does nothing without a key; admins see new orders in `/admin`.*

## Phase 4: Admin area

- [x] **P4.1 Login** `/admin/login`: Supabase Auth (email and password, or magic
  link). No public sign-up. Admins are invited from the Supabase dashboard and
  added to `admins`. `proxy`/middleware guards every `/admin` route, and each
  server action checks the role again.
  *Done 21 Sep: `/admin/login` (email + password), `src/proxy.ts` session check, `requireAdmin()` in the admin layout and every admin action.*
- [x] **P4.2 Orders list**: newest first, filter by status and template,
  search by name, phone or reference, and show the price and the date.
  *Done 21 Sep: `/admin` with status filter and search.*
- [x] **P4.3 Order detail**: every choice and answer, the uploaded photos
  (signed URLs, download all), status changes and internal notes (written to
  `order_events`).
  *Done 21 Sep: `/admin/orders/[id]`: details, answers, photos (1-hour signed links), status + note form, history.*
- [x] **P4.4 Contact messages** inbox with a "handled" toggle.
  *Done 21 Sep: `/admin/messages` with handled toggle.*
- [ ] **P4.5 Templates and pricing editors**: turn templates on and
  off, edit blurbs and images, edit every price value (unit tiers, frame, box,
  envelope, markup, designer fee, digital price). Seeded with today's numbers.
  *Partly done 21 Sep: `/admin/settings` can hide/show templates and edit all prices (JSON editor, validated). Names, categories, descriptions and gallery order are editable too (added 21 Sep). Changing preview images from the admin is still to do.*
- [ ] **P4.6 Migrate old orders** from the Formidable CSV (P0.2) into `orders`.

## Phase 4b: Fix inconsistencies found in the audit

Content and naming:

- [x] **I1** Slug `christan-wedding-template` is misspelt. The new route is
  `christian-wedding`, with a redirect from the old slug.
  *Fixed 21 Sep: slug is now `christian-wedding`, old URL redirects.*
- [x] **I2** "Summer camp souvenire" (one menu) vs "souvenir" (the other). Use "souvenir".
  *Fixed 21 Sep: "Summer camp souvenir" everywhere.*
- [x] **I3** "Sport's tribute" should be "Sports tribute". The page itself is
  basketball only.
  *Fixed 21 Sep: category "Sports tribute".*
- [ ] **I4** Wedding names don't match: the menu says "Wedding" (links only to
  Christian), the gallery says "Wedding 1/2", and the pages say "Christian" /
  "Wedding 2" (Muslim). Pick one naming scheme. Birthday 2 and Muslim wedding
  are missing from the menus.
  *Partly fixed 21 Sep: names are "Wedding 1 (Christian)" / "Wedding 2 (Muslim)", and every template is in the gallery. Owner to confirm the naming.*
- [x] **I5** The home page lists an "Art exhibition" template that doesn't exist.
  (owner) Add it or remove it.
  *Fixed 21 Sep: removed from the home page (template list comes from the database).*
- [ ] **I6** Mother's day and Father's day share one page with slug
  `mothers-day-template`. Give it a neutral slug, or make two templates.
  *Partly fixed 21 Sep: slug is now `mothers-fathers-day`. One or two templates is still an owner question.*
- [x] **I7** The form names are copy-paste leftovers: the Promotion page's form is
  called "retirment template form" (also misspelt). The new site generates
  names from the template.
  *Fixed 21 Sep: form names no longer exist; everything is generated from the template.*
- [ ] **I8** The three testimonials are the same quote ("Jad, Serial Gifter")
  repeated. (owner) Get real reviews or show one.
  *Partly fixed 21 Sep: shown once, marked as placeholder in the code. Real reviews still needed.*
- [x] **I9** Page titles are lowercase or placeholders ("home page -
  tailored-times.com", "contact us"). Write proper titles and meta
  descriptions for each page.
  *Fixed 21 Sep: every page has its own title ("… · Tailored Times").*
- [x] **I10** The contact form shows "Name * First Last *" as broken labels.
  *Fixed 21 Sep: first and last name are separate labelled fields.*
- [x] **I11** Home step 5 tells people to click a "Click here" link that isn't
  in the flow.
  *Fixed 21 Sep: step text rewritten; no "Click here".*

Order and price logic:

- [x] **I12** The home page says 1–48 pages and 1–500 copies, but the calculator
  offers only 1–24 pages and caps nothing. Enforce one set of limits in the
  pricing config and show it everywhere.
  *Fixed 21 Sep: one limit set: pages from the pricing config (1–24), copies 1–500, enforced on the server too.*
- [x] **I13** The formats disagree. The home page shows "Digital copy / Cover page
  only / Hard copy" and nests size under format. The calculator shows
  "Hard copy / Digital copy / Cover page". Use one list.
  *Fixed 21 Sep: one list: Hard copy / Digital copy / Cover page.*
- [x] **I14** Digital copy still asks for size, pages, copies and frames, which
  it ignores. Hide the fields that don't apply.
  *Fixed 21 Sep: Digital copy hides size, copies and frames; Cover page hides pages.*
- [ ] **I15** The copy says 8+ pages need the designer, but the calculator doesn't
  add the designer fee. (owner) Should 8+ pages switch "designer" on?
- [x] **I16** The Broadsheet unit price rises from 51 to 100 (2.85 > 2.60).
  *Owner, 21 Sep: keep as is; it becomes editable in the pricing admin (P4.5).*
- [x] **I17** The price is only calculated in the browser and copied into hidden
  fields, so a customer can edit it. The new site always recalculates on the
  server.
  *Fixed 21 Sep: `createOrder` recalculates with `calculatePrice`; the browser price is display only.*
- [x] **I18** The fonts disagree (Roboto in the globals, Inter/Cardo on the pages).
  Pick one pair when the visuals are redone.
  *Fixed 22 Sep: the new site uses the fonts the live pages actually show: Blenda Script, Bauhaus and Roboto (Inter/Cardo were WooCommerce leftovers).*

## Phase 5: Launch (on hold: owner said don't host yet, 21 Sep 2026)

- [ ] **P5.1** Deploy (owner choice from P0.1), set the env vars and connect the domain.
- [ ] **P5.2** Walk through the full order flow on phone and desktop, check an
  admin sees it, and check the email arrives.
- [ ] **P5.3** Switch DNS. Keep WordPress read-only for 30 days, then back it up
  and shut it down.
- [ ] **P5.4** Add a sitemap, robots and Open Graph images. Submit to Google Search Console.

## Phase 6: Make it better (after launch; plan in detail then)

- The visual redesign (the owner said visuals come later).
- Live preview of the customer's newspaper while they fill in the form.
- Online payment, if chosen in P0.1.
- Customer order-tracking page by reference number and phone.
- Customer proof approval: the designer uploads a proof, and the customer
  approves or asks for changes.
- Analytics: which templates sell, and where customers drop out of the order flow.
- WhatsApp contact button and order notifications.
