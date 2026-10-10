import { Request } from "express";
import { ApiError } from "./api-error.js";

export const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf("=");
        if (separatorIndex === -1) {
          return [cookie, ""];
        }

        const name = cookie.slice(0, separatorIndex);
        const value = cookie.slice(separatorIndex + 1);
        return [name, decodeURIComponent(value)];
      })
  );
};

export const validateCsrfRequest = (
  req: Request,
  bypassPaths: string[] = []
): void => {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return;
  }

  if (bypassPaths.some((path) => req.path === path)) {
    return;
  }

  const cookies = parseCookies(req.headers.cookie);
  const csrfCookie = cookies.hirelens_csrf;
  const headerValue = Array.isArray(req.headers["x-csrf-token"])
    ? req.headers["x-csrf-token"][0]
    : req.headers["x-csrf-token"];

  if (!csrfCookie || !headerValue || csrfCookie !== headerValue) {
    throw new ApiError(403, "Invalid or missing CSRF token");
  }
};
