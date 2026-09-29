import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { listSavedJobs, removeSavedJob, saveJob } from "../services/saved-job.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const jobs = await listSavedJobs(req.user!.userId);
  res.status(200).json(successResponse("Saved jobs retrieved successfully", { jobs }));
});

export const save = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await saveJob(req.user!.userId, req.params.jobId as string);
  res.status(201).json(successResponse("Job saved successfully", {}));
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await removeSavedJob(req.user!.userId, req.params.jobId as string);
  res.status(200).json(successResponse("Saved job removed successfully", {}));
});