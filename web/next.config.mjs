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

// What a page is allowed to load and talk to: this site, Google's fonts and
// Supabase, nothing else. Sent as a header, and repeated as a <meta> tag in the
// page itself (src/app/layout.tsx) because Hostinger's CDN replaces the header
// with one of its own. "frame-ancestors" only works as a header, so framing is
// also blocked by X-Frame-Options below.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // Next needs inline scripts for hydration; 'unsafe-eval' is dev only.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Orders carry up to 10 photos of 5 MB each (checked again in createOrder).
  experimental: {
    serverActions: { bodySizeLimit: "55mb" },
  },
  // Sent with every page. They do not stop a determined attacker on their own,
  // but they close the easy doors: the site cannot be framed by a copy of
  // itself, browsers may not guess at file types, forms can only post back
  // here, and nothing outside this list may be loaded or connected to.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY + "; frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
      // The back office is never indexed, framed or cached.
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/account/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
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
