import { Response } from "express";
import { z } from "zod";

import {
  AuthenticatedRequest
} from "../middleware/auth.middleware.js";

import {
  createCompany,
  getRecruiterCompany,
  updateRecruiterCompany
} from "../services/company.service.js";

import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";

const companySchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(150, "Company name cannot exceed 150 characters"),

  tagline: z
    .string()
    .max(160, "Company tagline cannot exceed 160 characters")
    .optional(),

  description: z
    .string()
    .max(3000)
    .optional(),

  website: z
    .string()
    .url("Please provide a valid website URL")
    .optional(),

  industry: z
    .string()
    .optional(),

  companySize: z
    .string()
    .optional(),

  location: z
    .object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional()
    })
    .optional(),

  logoUrl: z
    .string()
    .url("Please provide a valid logo URL")
    .optional()
});

export const create = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const ownerId = req.user!.userId;

    const validatedData = companySchema.parse(
      req.body
    );

    const company = await createCompany(
      ownerId,
      validatedData
    );

    res.status(201).json(
      successResponse(
        "Company created successfully",
        { company }
      )
    );
  }
);

export const getCompany = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const ownerId = req.user!.userId;

    const company = await getRecruiterCompany(
      ownerId
    );

    res.status(200).json(
      successResponse(
        "Company retrieved successfully",
        { company }
      )
    );
  }
);

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ownerId = req.user!.userId;
  const validatedData = companySchema.partial().parse(req.body);
  const company = await updateRecruiterCompany(ownerId, validatedData);
  res.status(200).json(successResponse("Company updated successfully", { company }));
});
