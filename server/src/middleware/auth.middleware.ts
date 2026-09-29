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

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication required");
  }

  const token = authHeader.split(" ")[1];

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