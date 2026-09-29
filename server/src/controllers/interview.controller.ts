import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { cancelInterview, createInterview, getInterview, listInterviews, updateInterview } from "../services/interview.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";

const interviewFields = z.object({
  applicationId: z.string().min(1),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.number().int().min(15).max(240),
  meetingUrl: z.string().url().optional(),
  notes: z.string().max(5000).optional()
}).strict();
const interviewSchema = interviewFields.superRefine((data, ctx) => {
  if (data.scheduledAt.getTime() <= Date.now()) {
    ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "Interview must be scheduled in the future" });
  }
});
const updateSchema = interviewFields.omit({ applicationId: true }).partial().extend({ status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional() }).strict().superRefine((data, ctx) => {
  if (data.scheduledAt && data.scheduledAt.getTime() <= Date.now()) {
    ctx.addIssue({ code: "custom", path: ["scheduledAt"], message: "Interview must be scheduled in the future" });
  }
});
const role = (req: AuthenticatedRequest) => req.user!.role as "CANDIDATE" | "RECRUITER" | "ADMIN";

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = interviewSchema.parse(req.body);
  const interview = await createInterview(req.user!.userId, data);
  res.status(201).json(successResponse("Interview scheduled successfully", { interview }));
});
export const my = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const interviews = await listInterviews(req.user!.userId, role(req));
  res.status(200).json(successResponse("Interviews retrieved successfully", { interviews }));
});
export const recruiter = my;
export const detail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const interview = await getInterview(req.params.id as string, req.user!.userId, role(req));
  res.status(200).json(successResponse("Interview retrieved successfully", { interview }));
});
export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const interview = await updateInterview(req.params.id as string, req.user!.userId, role(req), updateSchema.parse(req.body));
  res.status(200).json(successResponse("Interview updated successfully", { interview }));
});
export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const interview = await cancelInterview(req.params.id as string, req.user!.userId, role(req));
  res.status(200).json(successResponse("Interview cancelled successfully", { interview }));
});
