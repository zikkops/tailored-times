// Plain JavaScript on purpose: a next.config.ts has to be compiled before it can
// be read, and on build machines with an older glibc (Hostinger's, for one) Next
// falls back to its WebAssembly compiler, whose compiled config imports a temp
// file with no extension - which Node refuses to load. A .mjs config skips all
// of that and is read as-is everywhere.

// Old WordPress template URLs -> new slugs. Kept here rather than imported from
// src/, so nothing outside this file has to resolve while the config loads.
// src/lib/next-config.test.ts fails if these drift from TEMPLATES.
export const LEGACY_TEMPLATE_REDIRECTS = {
  "birthday-template": "birthday",
  "birthday-template-2": "birthday-2",
  "anniversary-template": "anniversary",
  "retirement-template": "retirement",
  "mothers-day-template": "mothers-fathers-day",
  "summer-camp-template": "summer-camp",
  "menu-template": "menu",
  "christan-wedding-template": "wedding-1",
  "muslim-wedding-template": "wedding-2",
  "basketball-tribute": "sports-tribute",
  "events-template": "events",
  "baby-shower-template": "baby-shower",
  "corporate-template": "corporate",
  "fashion-magazine-template": "fashion-magazine",
  "promotion-template": "promotion",
};

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Orders carry up to 10 photos of 5 MB each (checked again in createOrder).
  experimental: {
    serverActions: { bodySizeLimit: "55mb" },
  },
  // Old WordPress URLs keep working (and keep their Google ranking).
  async redirects() {
    return [
      ...Object.entries(LEGACY_TEMPLATE_REDIRECTS).map(([legacySlug, slug]) => ({
        source: `/${legacySlug}`,
        destination: `/templates/${slug}`,
        permanent: true,
      })),
      { source: "/template-gallery", destination: "/templates", permanent: true },
      // Slugs this site used before the names were made consistent (bug list R13).
      { source: "/templates/christian-wedding", destination: "/templates/wedding-1", permanent: true },
      { source: "/templates/muslim-wedding", destination: "/templates/wedding-2", permanent: true },
      { source: "/templates/basketball-tribute", destination: "/templates/sports-tribute", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      // Unused WooCommerce and test pages from the old site.
      ...["/shop", "/cart", "/checkout", "/my-account", "/test-calculator", "/trial-form", "/template-page"].map(
        (source) => ({ source, destination: "/", permanent: true }),
      ),
    ];
  },
};

export default nextConfig;
