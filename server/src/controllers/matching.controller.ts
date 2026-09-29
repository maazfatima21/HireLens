import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { createApplicationMatch, getApplicationMatch } from "../services/matching.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";

export const createMatch = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const match = await createApplicationMatch(req.user!.userId, req.params.applicationId as string);
  res.status(201).json(successResponse("Resume-job match generated", { match }));
});

export const getMatch = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const match = await getApplicationMatch(req.user!.userId, req.params.applicationId as string);
  res.status(200).json(successResponse("Resume-job match retrieved", { match }));
});
