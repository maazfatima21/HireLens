import { Types } from "mongoose";
import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
import { Application } from "../models/application.model.js";
import { ApiError } from "../utils/api-error.js";

const paging = (page: number, limit: number) => ({ skip: (page - 1) * limit, page, limit });
export const getStats = async () => {
  const [totalUsers, candidates, recruiters, admins, totalJobs, publishedJobs, draftJobs, closedJobs, totalApplications, totalCompanies, verifiedCompanies, applicationsByStatus] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: "CANDIDATE" }), User.countDocuments({ role: "RECRUITER" }), User.countDocuments({ role: "ADMIN" }), Job.countDocuments(), Job.countDocuments({ status: "PUBLISHED" }), Job.countDocuments({ status: "DRAFT" }), Job.countDocuments({ status: "CLOSED" }), Application.countDocuments(), Company.countDocuments(), Company.countDocuments({ isVerified: true }), Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
  ]);
  return { totalUsers, candidates, recruiters, admins, totalJobs, publishedJobs, draftJobs, closedJobs, totalApplications, applicationsByStatus: Object.fromEntries(applicationsByStatus.map((item) => [item._id, item.count])), totalCompanies, verifiedCompanies };
};

export const listUsers = async (input: { page: number; limit: number; search?: string; role?: string; isActive?: boolean }) => {
  const filter: Record<string, unknown> = {}; if (input.search) filter.$or = [{ name: { $regex: input.search, $options: "i" } }, { email: { $regex: input.search, $options: "i" } }]; if (input.role) filter.role = input.role; if (input.isActive !== undefined) filter.isActive = input.isActive;
  const { skip, page, limit } = paging(input.page, input.limit); const [users, total] = await Promise.all([User.find(filter).select("name email role isActive createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]); return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
export const setUserStatus = async (adminId: string, id: string, isActive: boolean) => { if (adminId === id) throw new ApiError(400, "Admins cannot deactivate themselves"); if (!Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid user ID"); const user = await User.findByIdAndUpdate(id, { isActive }, { returnDocument: "after" }).select("name email role isActive createdAt"); if (!user) throw new ApiError(404, "User not found"); return user; };

export const listJobs = async (input: { page: number; limit: number; search?: string; status?: string }) => { const filter: Record<string, unknown> = {}; if (input.search) filter.title = { $regex: input.search, $options: "i" }; if (input.status) filter.status = input.status; const { skip, page, limit } = paging(input.page, input.limit); const [jobs, total] = await Promise.all([Job.find(filter).select("title status jobType workMode createdBy companyId createdAt").populate("companyId", "name industry").sort({ createdAt: -1 }).skip(skip).limit(limit), Job.countDocuments(filter)]); return { jobs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }; };
export const setJobStatus = async (id: string, status: "DRAFT" | "PUBLISHED" | "CLOSED") => { if (!Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid job ID"); const job = await Job.findByIdAndUpdate(id, { status }, { returnDocument: "after" }).select("title status companyId createdAt").populate("companyId", "name"); if (!job) throw new ApiError(404, "Job not found"); return job; };

export const listCompanies = async (input: { page: number; limit: number; search?: string; isVerified?: boolean }) => { const filter: Record<string, unknown> = {}; if (input.search) filter.name = { $regex: input.search, $options: "i" }; if (input.isVerified !== undefined) filter.isVerified = input.isVerified; const { skip, page, limit } = paging(input.page, input.limit); const [companies, total] = await Promise.all([Company.find(filter).select("name industry ownerId isVerified createdAt").populate("ownerId", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit), Company.countDocuments(filter)]); return { companies, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }; };
export const verifyCompany = async (id: string, isVerified: boolean) => { if (!Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid company ID"); const company = await Company.findByIdAndUpdate(id, { isVerified }, { returnDocument: "after" }).select("name industry ownerId isVerified"); if (!company) throw new ApiError(404, "Company not found"); return company; };

export const listApplications = async (input: { page: number; limit: number; status?: string }) => { const filter: Record<string, unknown> = {}; if (input.status) filter.status = input.status; const { skip, page, limit } = paging(input.page, input.limit); const [applications, total] = await Promise.all([Application.find(filter).select("candidateId jobId status appliedAt updatedAt coverLetter").populate("candidateId", "name email phone profileImage").populate({ path: "jobId", select: "title companyId", populate: { path: "companyId", select: "name industry" } }).sort({ appliedAt: -1 }).skip(skip).limit(limit), Application.countDocuments(filter)]); return { applications, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }; };
