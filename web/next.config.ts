import type { NextConfig } from "next";
import { TEMPLATES } from "./src/data/templates";

const nextConfig: NextConfig = {
  // Orders carry up to 10 photos of 5 MB each (checked again in createOrder).
  experimental: {
    serverActions: { bodySizeLimit: "55mb" },
  },
  // Old WordPress URLs keep working (and keep their Google ranking).
  async redirects() {
    return [
      ...TEMPLATES.map((t) => ({
        source: `/${t.legacySlug}`,
        destination: `/templates/${t.slug}`,
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
