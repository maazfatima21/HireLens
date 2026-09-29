import { Types } from "mongoose";
import { Job } from "../models/job.model.js";
import { SavedJob } from "../models/saved-job.model.js";
import { ApiError } from "../utils/api-error.js";

const validateIds = (candidateId: string, jobId?: string) => {
  if (!Types.ObjectId.isValid(candidateId) || (jobId && !Types.ObjectId.isValid(jobId))) {
    throw new ApiError(400, "Invalid candidate or job ID");
  }
};

export const listSavedJobs = async (candidateId: string) => {
  validateIds(candidateId);
  const saved = await SavedJob.find({ candidateId }).sort({ createdAt: -1 }).select("jobId");
  const jobs = await Job.find({ _id: { $in: saved.map((item) => item.jobId) }, status: "PUBLISHED" })
    .populate("companyId", "name logoUrl industry location");
  const jobsById = new Map(jobs.map((job) => [job._id.toString(), job]));
  return saved.flatMap((item) => {
    const job = jobsById.get(item.jobId.toString());
    return job ? [job] : [];
  });
};

export const saveJob = async (candidateId: string, jobId: string) => {
  validateIds(candidateId, jobId);
  const job = await Job.findOne({ _id: jobId, status: "PUBLISHED" }).select("_id");
  if (!job) throw new ApiError(404, "Published job not found");
  await SavedJob.updateOne({ candidateId, jobId }, { $setOnInsert: { candidateId, jobId } }, { upsert: true });
};

export const removeSavedJob = async (candidateId: string, jobId: string) => {
  validateIds(candidateId, jobId);
  await SavedJob.deleteOne({ candidateId, jobId });
};