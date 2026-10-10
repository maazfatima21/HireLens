import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import { ApiError } from "../utils/api-error.js";

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isOperationalError = error instanceof ApiError || error instanceof ZodError;
  if (process.env.NODE_ENV !== "test") {
    console.error("Unhandled request error:", isOperationalError ? error.message : error);
  }

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

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};