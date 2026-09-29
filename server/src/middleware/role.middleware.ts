import { Response, NextFunction } from "express";
import {
  AuthenticatedRequest
} from "./auth.middleware.js";
import { ApiError } from "../utils/api-error.js";
import { UserRole } from "../models/user.model.js";

export const authorize = (
  ...allowedRoles: UserRole[]
) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      throw new ApiError(
        403,
        "You do not have permission to access this resource"
      );
    }

    next();
  };
};