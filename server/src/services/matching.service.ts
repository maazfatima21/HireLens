import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { ResumeAnalysis } from "../models/resume-analysis.model.js";
import { JobMatch } from "../models/job-match.model.js";
import { ApiError } from "../utils/api-error.js";
import { generateResumeJobMatch } from "./ai-matching.service.js";
import { Types } from "mongoose";

export const createApplicationMatch = async (candidateId: string, applicationId: string) => {
  if (!Types.ObjectId.isValid(candidateId) || !Types.ObjectId.isValid(applicationId)) throw new ApiError(400, "Invalid ID");
  const application = await Application.findOne({ _id: applicationId, candidateId });
  if (!application) throw new ApiError(404, "Application not found");
  const job = await Job.findOne({ _id: application.jobId, status: "PUBLISHED" });
  if (!job) throw new ApiError(404, "Published job not found");
  const resume = await ResumeAnalysis.findOne({ candidateId, analysisStatus: "COMPLETED" });
  if (!resume?.rawText) throw new ApiError(400, "A processed resume is required before matching");
  const result = await generateResumeJobMatch(resume.rawText, job);
  return JobMatch.findOneAndUpdate({ applicationId, candidateId, jobId: job._id }, { ...result }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
};

export const getApplicationMatch = async (candidateId: string, applicationId: string) => {
  if (!Types.ObjectId.isValid(candidateId) || !Types.ObjectId.isValid(applicationId)) throw new ApiError(400, "Invalid ID");
  const match = await JobMatch.findOne({ candidateId, applicationId }).sort({ createdAt: -1 });
  if (!match) throw new ApiError(404, "Match result not found");
  return match;
};
