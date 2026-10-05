import { Types } from "mongoose";

import {
  Application,
  ApplicationStatus
} from "../models/application.model.js";
import { ApplicationStatusHistory } from "../models/application-status-history.model.js";
import { Job } from "../models/job.model.js";
import { CandidateProfile } from "../models/candidate-profile.model.js";
import { notifyUser } from "./notification.service.js";
import { ApiError } from "../utils/api-error.js";

interface ApplyJobInput {
  jobId: string;
  coverLetter?: string;
  contactPhone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  relevantExperienceYears?: number;
  noticePeriod?: string;
}

export const applyToJob = async (
  candidateId: string,
  data: ApplyJobInput
) => {
  if (!Types.ObjectId.isValid(candidateId)) {
    throw new ApiError(400, "Invalid candidate ID");
  }

  if (!Types.ObjectId.isValid(data.jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const job = await Job.findOne({
    _id: data.jobId,
    status: "PUBLISHED"
  });

  if (!job) {
    throw new ApiError(
      404,
      "Published job not found"
    );
  }

  if (
    job.applicationDeadline &&
    job.applicationDeadline.getTime() < Date.now()
  ) {
    throw new ApiError(
      400,
      "The application deadline has passed"
    );
  }

  const existingApplication =
    await Application.findOne({
      jobId: data.jobId,
      candidateId
    });

  if (existingApplication) {
    throw new ApiError(
      409,
      "You have already applied to this job"
    );
  }

  const candidateProfile = await CandidateProfile.findOne({ userId: candidateId }).select("resume.fileKey");
  const application = await Application.create({
    jobId: data.jobId,
    candidateId,
    coverLetter: data.coverLetter,
    contactPhone: data.contactPhone,
    linkedinUrl: data.linkedinUrl,
    portfolioUrl: data.portfolioUrl,
    relevantExperienceYears: data.relevantExperienceYears,
    noticePeriod: data.noticePeriod,
    resumeFileKey: candidateProfile?.resume?.fileKey,
    status: "APPLIED"
  });

  await ApplicationStatusHistory.create({
    applicationId: application._id,
    status: "APPLIED",
    changedBy: candidateId
  });
  const statusLabel = application.status.replaceAll("_", " ").toLowerCase();
  await notifyUser({
    recipientId: application.candidateId,
    title: "Application update",
    message: `Your application for ${job.title} is now ${statusLabel}.`,
    link: `/applications/${application._id}`
  });

  return application;
};

export const getCandidateApplications = async (
  candidateId: string
) => {
  if (!Types.ObjectId.isValid(candidateId)) {
    throw new ApiError(400, "Invalid candidate ID");
  }

  const applications = await Application.find({
    candidateId
  })
    .populate(
      {
        path: "jobId",
        select:
          "title description skills jobType workMode location experienceMin experienceMax salaryMin salaryMax salaryCurrency status applicationDeadline companyId",
        populate: {
          path: "companyId",
          select:
            "name logoUrl industry location"
        }
      }
    )
    .sort({ appliedAt: -1 });

  return applications;
};

export const getJobApplications = async (
  recruiterId: string,
  jobId: string
) => {
  if (!Types.ObjectId.isValid(recruiterId)) {
    throw new ApiError(400, "Invalid recruiter ID");
  }

  if (!Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const job = await Job.findOne({
    _id: jobId,
    createdBy: recruiterId
  });

  if (!job) {
    throw new ApiError(
      404,
      "Job not found or you do not have access to this job"
    );
  }

  const applications = await Application.find({
    jobId
  })
    .populate(
      "candidateId",
      "name email phone profileImage"
    )
    .populate(
      {
        path: "jobId",
        select:
          "title jobType workMode location skills"
      }
    )
    .sort({ appliedAt: -1 });

  return applications;
};

const recruiterApplicationStatuses: ApplicationStatus[] = [
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED"
];

export const updateApplicationStatus = async (
  recruiterId: string,
  applicationId: string,
  status: ApplicationStatus,
  note?: string
) => {
  if (!Types.ObjectId.isValid(recruiterId)) {
    throw new ApiError(400, "Invalid recruiter ID");
  }

  if (!Types.ObjectId.isValid(applicationId)) {
    throw new ApiError(400, "Invalid application ID");
  }

  if (!recruiterApplicationStatuses.includes(status)) {
    throw new ApiError(400, "Invalid application status");
  }

  const application = await Application.findById(
    applicationId
  );

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  const job = await Job.findOne({
    _id: application.jobId,
    createdBy: recruiterId
  });

  if (!job) {
    throw new ApiError(
      403,
      "You do not have access to this application"
    );
  }

  if (application.status === status) {
    throw new ApiError(
      400,
      "Application already has this status"
    );
  }

  application.status = status;
  await application.save();

  await ApplicationStatusHistory.create({
    applicationId: application._id,
    status,
    changedBy: recruiterId,
    note
  });

  return application;
};

export const getRecruiterApplications = async (
  recruiterId: string
) => {
  if (!Types.ObjectId.isValid(recruiterId)) {
    throw new ApiError(400, "Invalid recruiter ID");
  }

  const recruiterJobs = await Job.find({
    createdBy: recruiterId
  }).select("_id");

  const applications = await Application.find({
    jobId: {
      $in: recruiterJobs.map((job) => job._id)
    }
  })
    .populate(
      "candidateId",
      "name email phone profileImage"
    )
    .populate(
      "jobId",
      "title status jobType workMode location"
    )
    .sort({ appliedAt: -1 });

  return applications;
};

export type ApplicationAccessRole =
  | "CANDIDATE"
  | "RECRUITER"
  | "ADMIN";

const getApplicationWithAccessCheck = async (
  applicationId: string,
  userId: string,
  role: ApplicationAccessRole
) => {
  if (
    !["CANDIDATE", "RECRUITER", "ADMIN"].includes(role)
  ) {
    throw new ApiError(
      403,
      "You do not have permission to access this application"
    );
  }

  if (!Types.ObjectId.isValid(applicationId)) {
    throw new ApiError(400, "Invalid application ID");
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const application = await Application.findById(
    applicationId
  );

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (
    role === "CANDIDATE" &&
    application.candidateId.toString() !== userId
  ) {
    throw new ApiError(
      403,
      "You do not have access to this application"
    );
  }

  if (role === "RECRUITER") {
    const job = await Job.findOne({
      _id: application.jobId,
      createdBy: userId
    });

    if (!job) {
      throw new ApiError(
        403,
        "You do not have access to this application"
      );
    }
  }

  return application;
};

export const getApplicationById = async (
  applicationId: string,
  userId: string,
  role: ApplicationAccessRole
) => {
  await getApplicationWithAccessCheck(
    applicationId,
    userId,
    role
  );

  const application = await Application.findById(
    applicationId
  )
    .populate(
      "candidateId",
      "name email phone profileImage"
    )
    .populate({
      path: "jobId",
      select:
        "title description skills jobType workMode location experienceMin experienceMax salaryMin salaryMax salaryCurrency applicationDeadline companyId",
      populate: {
        path: "companyId",
        select:
          "name description website industry location logoUrl"
      }
    });

  const history = await getApplicationHistory(
    applicationId,
    userId,
    role
  );

  return {
    application,
    history
  };
};

export const getApplicationHistory = async (
  applicationId: string,
  userId: string,
  role: ApplicationAccessRole
) => {
  await getApplicationWithAccessCheck(
    applicationId,
    userId,
    role
  );

  const history = await ApplicationStatusHistory.find({
    applicationId
  })
    .populate(
      "changedBy",
      "name role"
    )
    .sort({ createdAt: 1 });

  return history.map((entry) => {
    const changedBy = entry.changedBy as unknown as {
      _id: Types.ObjectId;
      name: string;
      role: string;
    };

    return {
      status: entry.status,
      note: entry.note ?? null,
      changedBy: changedBy
        ? {
            id: changedBy._id,
            name: changedBy.name,
            role: changedBy.role
          }
        : null,
      createdAt: entry.createdAt
    };
  });
};
