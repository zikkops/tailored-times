// Types for next.config.mjs, which is plain JavaScript on purpose (see the note
// at the top of that file). Without this, a clean checkout type-checks the
// config's named export as missing and the build fails.
import type { NextConfig } from "next";

export declare const LEGACY_TEMPLATE_REDIRECTS: Record<string, string>;
export declare const CONTENT_SECURITY_POLICY: string;

declare const nextConfig: NextConfig;
export default nextConfig;
