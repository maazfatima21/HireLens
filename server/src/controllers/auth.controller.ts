import { Request, Response } from "express";
import { z } from "zod";

import {
  registerUser,
  loginUser
} from "../services/auth.service.js";

import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";

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

    res.status(200).json(
      successResponse("Login successful", result)
    );
  }
);