import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticate } from "./auth.middleware.js";

describe("authenticate", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "01234567890123456789012345678901";
  });

  it("rejects requests without a bearer token or session cookie", () => {
    expect(() => authenticate({ headers: {} } as never, {} as never, (() => undefined) as never)).toThrow("Authentication required");
  });

  it("accepts a valid session cookie", () => {
    const token = jwt.sign({ userId: "user-123", role: "CANDIDATE" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    const req = { headers: { cookie: `hirelens_session=${token}` } } as never;
    const next = vi.fn();

    authenticate(req, {} as never, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).user).toMatchObject({ userId: "user-123", role: "CANDIDATE" });
  });

  it("rejects invalid token claims", () => {
    const token = jwt.sign({ userId: "user-123", role: "INVALID" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

    expect(() => authenticate({ headers: { cookie: `hirelens_session=${token}` } } as never, {} as never, (() => undefined) as never)).toThrow("Invalid or expired token");
  });
});
