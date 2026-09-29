import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { deleteResume, getResumeAnalysis, getResumeDownloadUrl, retryResumeAnalysis, uploadResume } from "../services/resume.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";

export const upload = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: "Resume file is required" });
    return;
  }
  const result = await uploadResume(req.user!.userId, req.file);
  res.status(201).json(successResponse("Resume uploaded and queued for processing", result));
});

export const get = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const url = await getResumeDownloadUrl(req.user!.userId);
  res.status(200).json(successResponse("Resume download URL generated", { url }));
});

export const analysis = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await getResumeAnalysis(req.user!.userId);
  res.status(200).json(successResponse("Resume analysis retrieved successfully", { analysis: result }));
});

export const retryAnalysis = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await retryResumeAnalysis(req.user!.userId);
  res.status(202).json(successResponse("Resume analysis queued for retry", result));
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await deleteResume(req.user!.userId);
  res.status(200).json(successResponse("Resume deleted successfully", {}));
});
