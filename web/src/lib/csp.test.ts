import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY as fromConfig } from "../../next.config.mjs";
import { CONTENT_SECURITY_POLICY as fromApp } from "./csp";

// The policy is written out twice on purpose (see src/lib/csp.ts). This keeps
// the two copies honest: the header and the page must say the same thing.
describe("content security policy", () => {
  it("is the same in next.config.mjs and in the page", () => {
    expect(fromApp).toBe(fromConfig);
  });
});
