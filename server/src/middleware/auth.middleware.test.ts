import { describe, expect, it } from "vitest";
import { authenticate } from "./auth.middleware.js";

describe("authenticate", () => {
  it("rejects requests without a bearer token", () => {
    expect(() => authenticate({ headers: {} } as never, {} as never, (() => undefined) as never)).toThrow("Authentication required");
  });
});
