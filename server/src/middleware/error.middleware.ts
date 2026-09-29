import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import { ApiError } from "../utils/api-error.js";

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(error);

  // Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });

    return;
  }

  // Application errors
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });

    return;
  }

  // Unknown errors
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};