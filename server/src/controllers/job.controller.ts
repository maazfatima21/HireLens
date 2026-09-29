import { Response } from "express";
import { z } from "zod";

import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

import {
  createJob,
  publishJob,
  getPublishedJobs,
  getPublishedJobById,
  getRecruiterJobs,
  searchPublishedJobs,
  updateJob,
  closeJob,
  deleteJob
} from "../services/job.service.js";

import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";

const jobFields = z.object({
  title: z
    .string()
    .min(2, "Job title must be at least 2 characters")
    .max(150),

  description: z
    .string()
    .min(20, "Job description must be at least 20 characters")
    .max(10000),

  skills: z
    .array(z.string().min(1))
    .min(1, "At least one skill is required"),

  jobType: z.enum([
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "INTERNSHIP"
  ]),

  workMode: z.enum([
    "ONSITE",
    "REMOTE",
    "HYBRID"
  ]),

  location: z
    .object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional()
    })
    .optional(),

  experienceMin: z.number().min(0).optional(),
  experienceMax: z.number().min(0).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),

  salaryCurrency: z
    .string()
    .length(3)
    .optional(),

  applicationDeadline: z
    .coerce
    .date()
    .optional()
}).strict();

const validateJobRanges = (data: {
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
}, ctx: z.RefinementCtx) => {
  if (data.experienceMin !== undefined && data.experienceMax !== undefined && data.experienceMin > data.experienceMax) {
    ctx.addIssue({ code: "custom", path: ["experienceMax"], message: "Maximum experience must be greater than or equal to minimum experience" });
  }
  if (data.salaryMin !== undefined && data.salaryMax !== undefined && data.salaryMin > data.salaryMax) {
    ctx.addIssue({ code: "custom", path: ["salaryMax"], message: "Maximum salary must be greater than or equal to minimum salary" });
  }
};

const jobSchema = jobFields.superRefine(validateJobRanges);
const updateJobSchema = jobFields.partial().superRefine(validateJobRanges);

export const create = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const recruiterId = req.user!.userId;

    const validatedData = jobSchema.parse(req.body);

    const job = await createJob(
      recruiterId,
      validatedData
    );

    res.status(201).json(
      successResponse(
        "Job created successfully",
        { job }
      )
    );
  }
);

export const publish = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const recruiterId = req.user!.userId;
    const jobId = req.params.id as string;

    const job = await publishJob(
      recruiterId,
      jobId
    );

    res.status(200).json(
      successResponse(
        "Job published successfully",
        { job }
      )
    );
  }
);

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = updateJobSchema.parse(req.body);
  const job = await updateJob(req.user!.userId, req.params.id as string, data);
  res.status(200).json(successResponse("Job updated successfully", { job }));
});

export const close = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const job = await closeJob(req.user!.userId, req.params.id as string);
  res.status(200).json(successResponse("Job closed successfully", { job }));
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await deleteJob(req.user!.userId, req.params.id as string);
  res.status(200).json(successResponse("Job deleted successfully", {}));
});

export const getPublished = asyncHandler(
  async (
    _req: AuthenticatedRequest,
    res: Response
  ) => {
    const page = Math.max(Number(_req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(_req.query.limit) || 10, 1), 50);
    const result = await getPublishedJobs(page, limit);

    res.status(200).json(
      successResponse(
        "Published jobs retrieved successfully",
        result
      )
    );
  }
);

export const getPublishedById = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const jobId = req.params.id as string;

    const job = await getPublishedJobById(jobId);

    res.status(200).json(
      successResponse(
        "Job retrieved successfully",
        { job }
      )
    );
  }
);

export const getMyJobs = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const recruiterId = req.user!.userId;

    const jobs = await getRecruiterJobs(
      recruiterId
    );

    res.status(200).json(
      successResponse(
        "Recruiter jobs retrieved successfully",
        { jobs }
      )
    );
  }
);

export const search = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const search = typeof req.query.search === "string"
      ? req.query.search
        : undefined;

    const location = typeof req.query.location === "string"
      ? req.query.location
      : undefined;

    const jobType = typeof req.query.jobType === "string"
      ? req.query.jobType
      : undefined;

    const workMode = typeof req.query.workMode === "string"
      ? req.query.workMode
      : undefined;

    const skills = typeof req.query.skills === "string"
      ? req.query.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : undefined;

    const jobs = await searchPublishedJobs({
      search,
      location,
      jobType: jobType as
        | "FULL_TIME"
        | "PART_TIME"
        | "CONTRACT"
        | "INTERNSHIP"
        | undefined,
      workMode: workMode as
        | "ONSITE"
        | "REMOTE"
        | "HYBRID"
        | undefined,
      skills
    }, Math.max(Number(req.query.page) || 1, 1), Math.min(Math.max(Number(req.query.limit) || 10, 1), 50));

    res.status(200).json(
      successResponse(
        "Jobs retrieved successfully",
        {
          jobs: jobs.jobs,
          pagination: jobs.pagination,
          filters: {
            search,
            location,
            jobType,
            workMode,
            skills
          }
        }
      )
    );
  }
);
