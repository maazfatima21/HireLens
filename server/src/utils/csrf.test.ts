import { describe, expect, it } from "vitest";
import { parseCookies, validateCsrfRequest } from "./csrf.js";

const createRequest = (options: {
  method?: string;
  path?: string;
  cookieHeader?: string;
  csrfHeader?: string | string[];
}) => ({
  method: options.method ?? "POST",
  path: options.path ?? "/api/jobs",
  headers: {
    cookie: options.cookieHeader,
    "x-csrf-token": options.csrfHeader,
  },
}) as any;

describe("csrf utilities", () => {
  it("parses a cookie header into a lookup map", () => {
    const cookies = parseCookies("hirelens_session=abc; hirelens_csrf=xyz; theme=dark");

    expect(cookies).toMatchObject({
      hirelens_session: "abc",
      hirelens_csrf: "xyz",
      theme: "dark",
    });
  });

  it("accepts valid CSRF tokens for mutating requests", () => {
    const req = createRequest({
      method: "POST",
      path: "/api/applications",
      cookieHeader: "hirelens_csrf=token-123",
      csrfHeader: "token-123",
    });

    expect(() => validateCsrfRequest(req, ["/api/auth/login"])).not.toThrow();
  });

  it("rejects missing CSRF tokens for mutating requests", () => {
    const req = createRequest({
      method: "PATCH",
      path: "/api/jobs/123",
      cookieHeader: "hirelens_csrf=token-123",
    });

    expect(() => validateCsrfRequest(req)).toThrow("Invalid or missing CSRF token");
  });

  it("rejects invalid CSRF tokens for mutating requests", () => {
    const req = createRequest({
      method: "DELETE",
      path: "/api/applications/123",
      cookieHeader: "hirelens_csrf=token-123",
      csrfHeader: "token-456",
    });

    expect(() => validateCsrfRequest(req)).toThrow("Invalid or missing CSRF token");
  });

  it("allows safe methods and exempted auth routes", () => {
    expect(() => validateCsrfRequest(createRequest({ method: "GET" }))).not.toThrow();
    expect(() => validateCsrfRequest(createRequest({ method: "POST", path: "/api/auth/login" }), ["/api/auth/login"])).not.toThrow();
  });
});
