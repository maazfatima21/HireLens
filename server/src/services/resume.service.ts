import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { CandidateProfile } from "../models/candidate-profile.model.js";
import { ResumeAnalysis } from "../models/resume-analysis.model.js";
import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { supabase, supabaseResumeBucket } from "../config/supabase.js";
import { redisConfigured } from "../config/redis.js";
import { enqueueResumeAnalysis } from "../queues/resume.queue.js";
import { ApiError } from "../utils/api-error.js";

const extensionFor = (mime: string) => mime === "application/pdf" ? "pdf" : "docx";
const resumeProcessingConfigured = () => redisConfigured && Boolean(process.env.GEMINI_API_KEY?.trim());
export const uploadResume = async (candidateId: string, file: Express.Multer.File) => {
  if (!resumeProcessingConfigured()) throw new ApiError(503, "Resume processing is not configured");
  const extension = file.originalname.toLowerCase().split(".").pop();
  if ((file.mimetype === "application/pdf" && extension !== "pdf") ||
      (file.mimetype !== "application/pdf" && extension !== "docx")) {
    throw new ApiError(400, "Resume extension does not match its file type");
  }
  const objectKey = `resumes/${candidateId}/${randomUUID()}.${extensionFor(file.mimetype)}`;
  const processingToken = randomUUID();
  const { error: uploadError } = await supabase.storage
    .from(supabaseResumeBucket)
    .upload(objectKey, file.buffer, { contentType: file.mimetype, upsert: false });
  if (uploadError) throw new ApiError(502, "Resume upload failed");
  const profile = await CandidateProfile.findOneAndUpdate(
    { userId: candidateId },
    { $set: { resume: { fileName: file.originalname, fileKey: objectKey, uploadedAt: new Date() } } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );
  await ResumeAnalysis.findOneAndUpdate(
    { candidateId },
    { $set: { resumeFileKey: objectKey, processingToken, skills: [], analysisStatus: "PENDING" }, $unset: { rawText: 1, errorMessage: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  let job;
  try {
    job = await enqueueResumeAnalysis(candidateId, objectKey, processingToken);
  } catch (error) {
    await ResumeAnalysis.findOneAndUpdate(
      { candidateId, resumeFileKey: objectKey, processingToken, analysisStatus: "PENDING" },
      { $set: { analysisStatus: "FAILED", errorMessage: "Resume analysis could not be queued. Please retry." } }
    );
    throw error;
  }
  return { profile, jobId: job.id, status: "QUEUED" };
};

export const retryResumeAnalysis = async (candidateId: string) => {
  if (!resumeProcessingConfigured()) throw new ApiError(503, "Resume processing is not configured");
  const profile = await CandidateProfile.findOne({ userId: candidateId });
  const resumeFileKey = profile?.resume?.fileKey;
  if (!resumeFileKey) throw new ApiError(404, "Resume not found");
  const processingToken = randomUUID();

  const analysis = await ResumeAnalysis.findOneAndUpdate(
    { candidateId, resumeFileKey, analysisStatus: "FAILED" },
    { $set: { processingToken, analysisStatus: "PENDING" }, $unset: { errorMessage: 1 } },
    { returnDocument: "after" }
  );
  if (!analysis) throw new ApiError(409, "Resume analysis is not in a failed state");

  try {
    const job = await enqueueResumeAnalysis(candidateId, resumeFileKey, processingToken);
    return { jobId: job.id, status: "QUEUED" };
  } catch (error) {
    await ResumeAnalysis.findOneAndUpdate(
      { _id: analysis._id, resumeFileKey, processingToken, analysisStatus: "PENDING" },
      { $set: { analysisStatus: "FAILED", errorMessage: "Could not queue resume analysis for retry" } }
    );
    throw error;
  }
};

export const deleteResume = async (candidateId: string) => {
  const profile = await CandidateProfile.findOne({ userId: candidateId });
  if (!profile?.resume?.fileKey) throw new ApiError(404, "Resume not found");
  const { error: deleteError } = await supabase.storage
    .from(supabaseResumeBucket)
    .remove([profile.resume.fileKey]);
  if (deleteError) throw new ApiError(502, "Resume deletion failed");
  profile.resume = undefined;
  await profile.save();
  await ResumeAnalysis.deleteOne({ candidateId });
};

export const getResumeDownloadUrl = async (candidateId: string) => {
  const profile = await CandidateProfile.findOne({ userId: candidateId });
  if (!profile?.resume?.fileKey) throw new ApiError(404, "Resume not found");
  const { data, error } = await supabase.storage
    .from(supabaseResumeBucket)
    .createSignedUrl(profile.resume.fileKey, 900);
  if (error || !data?.signedUrl) throw new ApiError(502, "Resume download URL generation failed");
  return data.signedUrl;
};

export const getApplicationResumeDownloadUrl = async (recruiterId: string, applicationId: string) => {
  if (!Types.ObjectId.isValid(recruiterId) || !Types.ObjectId.isValid(applicationId)) {
    throw new ApiError(400, "Invalid recruiter or application ID");
  }
  const application = await Application.findById(applicationId).select("jobId candidateId resumeFileKey");
  if (!application) throw new ApiError(404, "Application not found");
  const job = await Job.findOne({ _id: application.jobId, createdBy: recruiterId }).select("_id");
  if (!job) throw new ApiError(403, "You do not have access to this application");

  const profile = application.resumeFileKey
    ? null
    : await CandidateProfile.findOne({ userId: application.candidateId }).select("resume.fileKey");
  const fileKey = application.resumeFileKey || profile?.resume?.fileKey;
  if (!fileKey) throw new ApiError(404, "No resume was attached to this application");

  const { data, error } = await supabase.storage
    .from(supabaseResumeBucket)
    .createSignedUrl(fileKey, 300, { download: true });
  if (error || !data?.signedUrl) throw new ApiError(502, "Resume download URL generation failed");
  return data.signedUrl;
};

export const getResumeAnalysis = async (candidateId: string) => {
  if (!Types.ObjectId.isValid(candidateId)) throw new ApiError(400, "Invalid candidate ID");
  return ResumeAnalysis.findOne({ candidateId })
    .select("analysisStatus errorMessage skills experienceSummary strengths areasForImprovement suggestedRoles professionalSummary updatedAt")
    .lean();
};
