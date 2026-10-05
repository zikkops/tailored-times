import type { NextConfig } from "next";

// Old WordPress template URLs → new slugs. Kept inline (no local imports) because
// hosts like Hostinger copy this file elsewhere and load it with plain Node, which
// can't resolve "./src/...". src/lib/next-config.test.ts checks it matches TEMPLATES.
export const LEGACY_TEMPLATE_REDIRECTS: Record<string, string> = {
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

const nextConfig: NextConfig = {
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
