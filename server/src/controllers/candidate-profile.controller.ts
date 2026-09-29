import { Response } from "express";
import { z } from "zod";

import {
  AuthenticatedRequest
} from "../middleware/auth.middleware.js";

import {
  getCandidateProfile,
  upsertCandidateProfile
} from "../services/candidate-profile.service.js";

import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";

const experienceSchema = z.object({
  company: z.string().min(1),
  jobTitle: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional()
});

const educationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  fieldOfStudy: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

const profileSchema = z.object({
  headline: z.string().max(150).optional(),

  bio: z.string().max(2000).optional(),

  skills: z
    .array(z.string().min(1))
    .optional(),

  experience: z
    .array(experienceSchema)
    .optional(),

  education: z
    .array(educationSchema)
    .optional(),

  location: z
    .object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional()
    })
    .optional()
});

export const getProfile = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const userId = req.user!.userId;

    const profile = await getCandidateProfile(userId);

    res.status(200).json(
      successResponse(
        "Candidate profile retrieved successfully",
        { profile }
      )
    );
  }
);

export const updateProfile = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const userId = req.user!.userId;

    const validatedData = profileSchema.parse(req.body);

    const profile = await upsertCandidateProfile(
      userId,
      validatedData
    );

    res.status(200).json(
      successResponse(
        "Candidate profile updated successfully",
        { profile }
      )
    );
  }
);