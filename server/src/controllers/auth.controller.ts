import crypto from "node:crypto";
import { Request, Response } from "express";
import { z } from "zod";

import {
  registerUser,
  loginUser
} from "../services/auth.service.js";

import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .string()
    .email("Please provide a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
});

const loginSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
});

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_BASE_OPTIONS = {
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const setSessionCookies = (res: Response, token: string) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");

  res.cookie("hirelens_session", token, {
    ...COOKIE_BASE_OPTIONS,
    httpOnly: true,
    maxAge: SESSION_TTL_MS,
  });

  res.cookie("hirelens_csrf", csrfToken, {
    ...COOKIE_BASE_OPTIONS,
    httpOnly: false,
    maxAge: SESSION_TTL_MS,
  });

  return csrfToken;
};

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body);

    const user = await registerUser(validatedData);

    res.status(201).json(
      successResponse("Account created successfully", {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    );
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body);

    const result = await loginUser(validatedData);
    setSessionCookies(res, result.token);

    res.status(200).json(
      successResponse("Login successful", {
        user: result.user
      })
    );
  }
);

export const me = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const user = await (await import("../models/user.model.js")).User.findById(userId).select("name email role isActive");

    if (!user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    res.status(200).json(
      successResponse("User retrieved successfully", {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        }
      })
    );
  }
);

export const logout = asyncHandler(
  async (_req: Request, res: Response) => {
    res.clearCookie("hirelens_session", { ...COOKIE_BASE_OPTIONS, httpOnly: true });
    res.clearCookie("hirelens_csrf", { ...COOKIE_BASE_OPTIONS, httpOnly: false });

    res.status(200).json(successResponse("Logged out successfully", null));
  }
);