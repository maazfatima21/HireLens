import { Response } from "express";
import { z } from "zod";

import {
  AuthenticatedRequest
} from "../middleware/auth.middleware.js";

import { ApplicationStatus } from "../models/application.model.js";

import {
  applyToJob,
  getCandidateApplications,
  getJobApplications,
  getRecruiterApplications,
  updateApplicationStatus,
  getApplicationById,
  getApplicationHistory,
  ApplicationAccessRole
} from "../services/application.service.js";

import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { getApplicationResumeDownloadUrl } from "../services/resume.service.js";

const applySchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),

  coverLetter: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(5000, "Cover letter cannot exceed 5000 characters").optional()
  ),
  contactPhone: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(40).optional()
  ),
  linkedinUrl: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().url("LinkedIn profile must be a valid URL").max(500).optional()
  ),
  portfolioUrl: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().url("Portfolio or website must be a valid URL").max(500).optional()
  ),
  relevantExperienceYears: z.preprocess(
    (value) => value === "" || value === null || value === undefined ? undefined : Number(value),
    z.number().int().min(0).max(60).optional()
  ),
  noticePeriod: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.enum(["IMMEDIATE", "TWO_WEEKS", "ONE_MONTH", "TWO_MONTHS", "THREE_MONTHS", "OTHER"]).optional()
  ),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEW",
    "SELECTED",
    "REJECTED"
  ]),
  note: z
    .string()
    .trim()
    .max(1000, "Status note cannot exceed 1000 characters")
    .optional()
  }).strict();

export const apply = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const candidateId = req.user!.userId;

    const validatedData = applySchema.parse(
      req.body
    );

    const application = await applyToJob(
      candidateId,
      validatedData
    );

    res.status(201).json(
      successResponse(
        "Application submitted successfully",
        {
          application
        }
      )
    );
  }
);

export const getApplicationResume = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const url = await getApplicationResumeDownloadUrl(req.user!.userId, req.params.applicationId as string);
  res.status(200).json(successResponse("Application resume URL generated", { url }));
});

export const getMyApplications = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const candidateId = req.user!.userId;

    const applications =
      await getCandidateApplications(
        candidateId
      );

    res.status(200).json(
      successResponse(
        "Applications retrieved successfully",
        {
          applications
        }
      )
    );
  }
);

export const getApplicantsForJob = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const recruiterId = req.user!.userId;
    const jobId = req.params.jobId as string;

    const applications =
      await getJobApplications(
        recruiterId,
        jobId
      );

    res.status(200).json(
      successResponse(
        "Job applicants retrieved successfully",
        {
          applications
        }
      )
    );
  }
);

export const updateStatus = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const recruiterId = req.user!.userId;
    const applicationId = req.params.applicationId as string;
    const { status, note } = updateStatusSchema.parse(
      req.body
    );

    const application = await updateApplicationStatus(
      recruiterId,
      applicationId,
      status as ApplicationStatus,
      note
    );

    res.status(200).json(
      successResponse(
        "Application status updated successfully",
        {
          application
        }
      )
    );
  }
);

export const getRecruiterApplicationsList = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const recruiterId = req.user!.userId;

    const applications = await getRecruiterApplications(
      recruiterId
    );

    res.status(200).json(
      successResponse(
        "Recruiter applications retrieved successfully",
        {
          applications
        }
      )
    );
  }
);

export const getApplicationDetails = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const userId = req.user!.userId;
    const role = req.user!.role as ApplicationAccessRole;
    const applicationId = req.params.applicationId as string;

    const result = await getApplicationById(
      applicationId,
      userId,
      role
    );

    res.status(200).json(
      successResponse(
        "Application details retrieved successfully",
        {
          application: result.application,
          history: result.history
        }
      )
    );
  }
);

export const getApplicationHistoryDetails = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const userId = req.user!.userId;
    const role = req.user!.role as ApplicationAccessRole;
    const applicationId = req.params.applicationId as string;

    const history = await getApplicationHistory(
      applicationId,
      userId,
      role
    );

    res.status(200).json(
      successResponse(
        "Application status history retrieved successfully",
        {
          history
        }
      )
    );
  }
);
