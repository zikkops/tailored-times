// What a page may load and talk to: this site, Google's fonts and Supabase,
// and nothing else.
//
// It lives here, rather than being imported from next.config.mjs, because
// Hostinger swaps that file for one of its own when it runs the app: the
// import came back empty there and the page went out with no policy at all.
// next.config.mjs keeps its own copy for the header; src/lib/csp.test.ts fails
// if the two ever drift apart.
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
