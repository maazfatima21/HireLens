import { Types } from "mongoose";

import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
import { Application } from "../models/application.model.js";
import { ApiError } from "../utils/api-error.js";

interface CreateJobInput {
  title: string;
  description: string;
  skills: string[];
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  workMode: "ONSITE" | "REMOTE" | "HYBRID";
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  applicationDeadline?: Date;
}

export const createJob = async (
  recruiterId: string,
  data: CreateJobInput
) => {
  if (!Types.ObjectId.isValid(recruiterId)) {
    throw new ApiError(400, "Invalid recruiter ID");
  }

  const company = await Company.findOne({
    ownerId: recruiterId
  });

  if (!company) {
    throw new ApiError(
      404,
      "Create a company before creating a job"
    );
  }

  const job = await Job.create({
    ...data,
    companyId: company._id,
    createdBy: recruiterId,
    status: "DRAFT"
  });

  return job;
};

export const publishJob = async (
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
    throw new ApiError(404, "Job not found");
  }

  if (job.status === "PUBLISHED") {
    throw new ApiError(400, "Job is already published");
  }

  if (job.status === "CLOSED") {
    throw new ApiError(400, "Closed jobs cannot be published");
  }

  validateJobForPublishing(job);

  job.status = "PUBLISHED";

  await job.save();

  return job;
};

export const getPublishedJobs = async (
  page = 1,
  limit = 10
) => {
  const filter = {
    status: "PUBLISHED"
  } as const;
  const [jobs, total] = await Promise.all([
    Job.find(filter)
    .populate("companyId", "name tagline description website logoUrl industry location")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit),
    Job.countDocuments(filter)
  ]);

  return { jobs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getPublishedJobById = async (
  jobId: string
) => {
  if (!Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const job = await Job.findOne({
    _id: jobId,
    status: "PUBLISHED"
  }).populate(
    "companyId",
    "name description website industry location logoUrl"
  );

  if (!job) {
    throw new ApiError(404, "Published job not found");
  }

  return job;
};

export const getRecruiterJobs = async (
  recruiterId: string
) => {
  if (!Types.ObjectId.isValid(recruiterId)) {
    throw new ApiError(400, "Invalid recruiter ID");
  }

  const jobs = await Job.find({
    createdBy: recruiterId
  })
    .populate(
      "companyId",
      "name logoUrl industry location"
    )
    .sort({ createdAt: -1 });

  return jobs;
};

const validateJobForPublishing = (job: {
  title: string;
  description: string;
  skills: string[];
  jobType: string;
  workMode: string;
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  applicationDeadline?: Date;
}) => {
  if (!job.title || job.title.trim().length < 2) {
    throw new ApiError(400, "A valid job title is required before publishing");
  }
  if (!job.description || job.description.trim().length < 20) {
    throw new ApiError(400, "A valid job description is required before publishing");
  }
  if (!job.skills?.length || !job.jobType || !job.workMode) {
    throw new ApiError(400, "Job skills, type, and work mode are required before publishing");
  }
  if (job.experienceMin !== undefined && job.experienceMax !== undefined && job.experienceMin > job.experienceMax) {
    throw new ApiError(400, "Minimum experience cannot exceed maximum experience");
  }
  if (job.salaryMin !== undefined && job.salaryMax !== undefined && job.salaryMin > job.salaryMax) {
    throw new ApiError(400, "Minimum salary cannot exceed maximum salary");
  }
  if (job.applicationDeadline && job.applicationDeadline.getTime() < Date.now()) {
    throw new ApiError(400, "Application deadline cannot be in the past");
  }
};

export const updateJob = async (
  recruiterId: string,
  jobId: string,
  data: Partial<Parameters<typeof createJob>[1]>
) => {
  if (!Types.ObjectId.isValid(recruiterId) || !Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid recruiter or job ID");
  }
  const job = await Job.findOneAndUpdate(
    { _id: jobId, createdBy: recruiterId, status: { $ne: "CLOSED" } },
    { $set: data },
    { returnDocument: "after", runValidators: true }
  );
  if (!job) throw new ApiError(404, "Job not found or cannot be modified");
  return job;
};

export const closeJob = async (recruiterId: string, jobId: string) => {
  if (!Types.ObjectId.isValid(recruiterId) || !Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid recruiter or job ID");
  }
  const job = await Job.findOne({ _id: jobId, createdBy: recruiterId });
  if (!job) throw new ApiError(404, "Job not found");
  if (job.status === "CLOSED") throw new ApiError(400, "Job is already closed");
  if (job.status !== "PUBLISHED") throw new ApiError(400, "Only published jobs can be closed");
  job.status = "CLOSED";
  await job.save();
  return job;
};

export const deleteJob = async (recruiterId: string, jobId: string) => {
  if (!Types.ObjectId.isValid(recruiterId) || !Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid recruiter or job ID");
  }
  const job = await Job.findOne({ _id: jobId, createdBy: recruiterId });
  if (!job) throw new ApiError(404, "Job not found");
  const applicationCount = await Application.countDocuments({ jobId });
  if (applicationCount > 0) throw new ApiError(409, "Jobs with applications cannot be deleted");
  await job.deleteOne();
};

export const searchPublishedJobs = async (
  filters: {
    search?: string;
    location?: string;
    jobType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
    workMode?: "ONSITE" | "REMOTE" | "HYBRID";
    skills?: string[];
  },
  page = 1,
  limit = 10
) => {
  const query: Record<string, unknown> = {
    status: "PUBLISHED"
  };

  if (filters.search) {
    query.$text = {
      $search: filters.search
    };
  }

  if (filters.jobType) {
    query.jobType = filters.jobType;
  }

  if (filters.workMode) {
    query.workMode = filters.workMode;
  }

  if (filters.location) {
    query.$or = [
      {
        "location.city": {
          $regex: filters.location,
          $options: "i"
        }
      },
      {
        "location.state": {
          $regex: filters.location,
          $options: "i"
        }
      },
      {
        "location.country": {
          $regex: filters.location,
          $options: "i"
        }
      }
    ];
  }

  if (filters.skills && filters.skills.length > 0) {
    query.skills = {
      $in: filters.skills.map((skill) => new RegExp(
        `^${skill.trim()}$`,
        "i"
      ))
    };
  }

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate("companyId", "name tagline description website logoUrl industry location")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Job.countDocuments(query)
  ]);

  return {
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
