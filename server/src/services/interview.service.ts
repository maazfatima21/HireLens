import { Types } from "mongoose";
import { Interview, InterviewStatus } from "../models/interview.model.js";
import { Application } from "../models/application.model.js";
import { ApplicationStatusHistory } from "../models/application-status-history.model.js";
import { Job } from "../models/job.model.js";
import { ApiError } from "../utils/api-error.js";
import { notifyUser } from "./notification.service.js";

type Role = "CANDIDATE" | "RECRUITER" | "ADMIN";
const getApplication = async (applicationId: string, userId: string, role: Role) => {
  if (!Types.ObjectId.isValid(applicationId) || !Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid ID");
  const application = await Application.findById(applicationId);
  if (!application) throw new ApiError(404, "Application not found");
  const job = await Job.findById(application.jobId);
  if (!job) throw new ApiError(404, "Job not found");
  if (role === "CANDIDATE" && application.candidateId.toString() !== userId) throw new ApiError(403, "You do not have access to this application");
  if (role === "RECRUITER" && job.createdBy.toString() !== userId) throw new ApiError(403, "You do not have access to this application");
  return { application, job };
};

export const createInterview = async (recruiterId: string, data: { applicationId: string; scheduledAt: Date; durationMinutes: number; meetingUrl?: string; notes?: string }) => {
  const { application, job } = await getApplication(data.applicationId, recruiterId, "RECRUITER");
  if (job.createdBy.toString() !== recruiterId) throw new ApiError(403, "You do not own this job");
  const interview = await Interview.create({ ...data, candidateId: application.candidateId, recruiterId, status: "SCHEDULED" });
  if (application.status !== "INTERVIEW") {
    application.status = "INTERVIEW";
    await application.save();
    await ApplicationStatusHistory.create({ applicationId: application._id, status: "INTERVIEW", changedBy: recruiterId, note: "Interview scheduled" });
  }
  await notifyUser({
    recipientId: application.candidateId,
    title: "Interview scheduled",
    message: `An interview for ${job.title} has been scheduled for ${interview.scheduledAt.toISOString()}.`,
    link: "/interviews"
  });
  return interview;
};

export const listInterviews = async (userId: string, role: Role, applicationId?: string) => {
  if (applicationId) await getApplication(applicationId, userId, role);
  const filter = role === "CANDIDATE" ? { candidateId: userId } : role === "RECRUITER" ? { recruiterId: userId } : {};
  if (applicationId) Object.assign(filter, { applicationId });
  return Interview.find(filter).sort({ scheduledAt: 1 });
};

export const getInterview = async (id: string, userId: string, role: Role) => {
  if (!Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid interview ID");
  const interview = await Interview.findById(id);
  if (!interview) throw new ApiError(404, "Interview not found");
  await getApplication(interview.applicationId.toString(), userId, role);
  return interview;
};

export const updateInterview = async (id: string, userId: string, role: Role, data: Partial<{ scheduledAt: Date; durationMinutes: number; meetingUrl?: string; notes?: string; status: InterviewStatus }>) => {
  const interview = await getInterview(id, userId, role);
  if (role === "CANDIDATE") throw new ApiError(403, "Candidates cannot modify interviews");
  Object.assign(interview, data);
  await interview.save();
  if (data.status || data.scheduledAt) {
    const { job } = await getApplication(interview.applicationId.toString(), userId, role);
    const change = data.status ? `The interview for ${job.title} is now ${data.status.toLowerCase()}.` : `The interview for ${job.title} has been rescheduled.`;
    await notifyUser({ recipientId: interview.candidateId, title: "Interview update", message: change, link: "/interviews" });
  }
  return interview;
};

export const cancelInterview = async (id: string, userId: string, role: Role) => updateInterview(id, userId, role, { status: "CANCELLED" });
