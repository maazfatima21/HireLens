import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import * as service from "../services/admin.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";

const query = (req: AuthenticatedRequest) => ({ page: Math.max(Number(req.query.page) || 1, 1), limit: Math.min(Math.max(Number(req.query.limit) || 10, 1), 50), search: typeof req.query.search === "string" ? req.query.search.trim() : undefined });
const optionalBool = (value: unknown) => value === undefined ? undefined : value === "true";
export const stats = asyncHandler(async (_req, res) => { res.json(successResponse("Admin stats retrieved successfully", await service.getStats())); });
export const users = asyncHandler(async (req: AuthenticatedRequest, res: Response) => { res.json(successResponse("Users retrieved successfully", await service.listUsers({ ...query(req), role: typeof req.query.role === "string" ? req.query.role : undefined, isActive: optionalBool(req.query.isActive) }))); });
export const userStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => { const body = z.object({ isActive: z.boolean() }).strict().parse(req.body); res.json(successResponse("User status updated successfully", { user: await service.setUserStatus(req.user!.userId, req.params.id as string, body.isActive) })); });
export const jobs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => { res.json(successResponse("Jobs retrieved successfully", await service.listJobs({ ...query(req), status: typeof req.query.status === "string" ? req.query.status : undefined }))); });
export const jobStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => { const body = z.object({ status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]) }).strict().parse(req.body); res.json(successResponse("Job status updated successfully", { job: await service.setJobStatus(req.params.id as string, body.status) })); });
export const companies = asyncHandler(async (req: AuthenticatedRequest, res: Response) => { res.json(successResponse("Companies retrieved successfully", await service.listCompanies({ ...query(req), isVerified: optionalBool(req.query.isVerified) }))); });
export const companyVerify = asyncHandler(async (req: AuthenticatedRequest, res: Response) => { const body = z.object({ isVerified: z.boolean() }).strict().parse(req.body); res.json(successResponse("Company verification updated successfully", { company: await service.verifyCompany(req.params.id as string, body.isVerified) })); });
export const applications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => { res.json(successResponse("Applications retrieved successfully", await service.listApplications({ ...query(req), status: typeof req.query.status === "string" ? req.query.status : undefined }))); });
