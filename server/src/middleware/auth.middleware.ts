import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api-error.js";

interface JwtPayload {
  userId: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

const parseSessionToken = (req: Request): string | null => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return null;
  }

  const cookieEntries = cookieHeader.split(";").map((cookie) => cookie.trim());
  const sessionCookie = cookieEntries.find((cookie) => cookie.startsWith("hirelens_session="));

  if (!sessionCookie) {
    return null;
  }

  const [, token] = sessionCookie.split("=");
  return token ? decodeURIComponent(token) : null;
};

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const tokenFromCookie = parseSessionToken(req);
  const token = tokenFromCookie || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  try {
    const decoded = jwt.verify(token, secret) as Partial<JwtPayload>;
    if (!decoded.userId || !decoded.role || !["CANDIDATE", "RECRUITER", "ADMIN"].includes(decoded.role)) {
      throw new ApiError(401, "Invalid token claims");
    }

    req.user = { userId: decoded.userId, role: decoded.role };

    next();
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
};