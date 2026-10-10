import { api } from "./axios";
import type {
	ApiResponse,
	Application,
	CandidateProfile,
	Company,
	Interview,
	Job,
	JobMatch,
	Notification,
	Pagination,
	ResumeAnalysis,
	ResumeUploadResult,
	StatusHistory,
	User,
} from "../types";

export const authApi = {
	login: (body: unknown) =>
		api.post<ApiResponse<{ user: User }>>("/auth/login", body),
	register: (body: unknown) =>
		api.post<ApiResponse<unknown>>("/auth/register", body),
	me: () =>
		api.get<ApiResponse<{ user: User }>>("/auth/me"),
	logout: () =>
		api.post<ApiResponse<unknown>>("/auth/logout", {}),
};

export const jobsApi = {
	list: (params: unknown) =>
		api.get<ApiResponse<{ jobs: Job[]; pagination: Pagination }>>("/jobs", { params }),
	detail: (id: string) =>
		api.get<ApiResponse<{ job: Job }>>(`/jobs/${id}`),
	search: (params: unknown) =>
		api.get<ApiResponse<{ jobs: Job[]; pagination: Pagination }>>(
			"/jobs/search",
			{ params },
		),
	mine: () =>
		api.get<ApiResponse<{ jobs: Job[] }>>("/jobs/recruiter/mine"),
	create: (body: unknown) =>
		api.post<ApiResponse<{ job: Job }>>("/jobs", body),
	update: (id: string, body: unknown) =>
		api.patch<ApiResponse<{ job: Job }>>(`/jobs/${id}`, body),
	publish: (id: string) =>
		api.patch<ApiResponse<{ job: Job }>>(`/jobs/${id}/publish`),
	close: (id: string) =>
		api.patch<ApiResponse<{ job: Job }>>(`/jobs/${id}/close`),
	remove: (id: string) =>
		api.delete<ApiResponse<unknown>>(`/jobs/${id}`),
};

export const applicationsApi = {
	mine: () =>
		api.get<ApiResponse<{ applications: Application[] }>>("/applications/my"),
	recruiter: () =>
		api.get<ApiResponse<{ applications: Application[] }>>("/applications/recruiter"),
	forJob: (jobId: string) =>
		api.get<ApiResponse<{ applications: Application[] }>>(
			`/applications/job/${jobId}`,
		),
	apply: (body: unknown) =>
		api.post<ApiResponse<{ application: Application }>>("/applications", body),
	detail: (id: string) =>
		api.get<ApiResponse<{ application: Application; history: StatusHistory[] }>>(
			`/applications/${id}`,
		),
	updateStatus: (id: string, body: { status: string; note?: string }) =>
		api.patch<ApiResponse<{ application: Application }>>(
			`/applications/${id}/status`,
			body,
		),
	createMatch: (id: string) =>
		api.post<ApiResponse<{ match: JobMatch }>>(`/applications/${id}/match`),
	match: (id: string) =>
		api.get<ApiResponse<{ match: JobMatch }>>(`/applications/${id}/match`),
	resume: (id: string) =>
		api.get<ApiResponse<{ url: string }>>(`/applications/${id}/resume`),
};

export const savedJobsApi = {
	list: () =>
		api.get<ApiResponse<{ jobs: Job[] }>>("/saved-jobs"),
	save: (jobId: string) =>
		api.put<ApiResponse<unknown>>(`/saved-jobs/${jobId}`),
	remove: (jobId: string) =>
		api.delete<ApiResponse<unknown>>(`/saved-jobs/${jobId}`),
};

export const notificationsApi = {
	list: () =>
		api.get<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>(
			"/notifications",
		),
	read: (id: string) =>
		api.patch<ApiResponse<{ notification: Notification }>>(
			`/notifications/${id}/read`,
		),
};

export const profileApi = {
	get: () =>
		api.get<ApiResponse<{ profile: CandidateProfile }>>("/profile"),
	update: (body: unknown) =>
		api.put<ApiResponse<{ profile: CandidateProfile }>>("/profile", body),
};

export const companyApi = {
	get: () =>
		api.get<ApiResponse<{ company: Company }>>("/company"),
	create: (body: unknown) =>
		api.post<ApiResponse<{ company: Company }>>("/company", body),
	update: (body: unknown) =>
		api.patch<ApiResponse<{ company: Company }>>("/company", body),
};

export const interviewsApi = {
	mine: () =>
		api.get<ApiResponse<{ interviews: Interview[] }>>("/interviews/my"),
	recruiter: () =>
		api.get<ApiResponse<{ interviews: Interview[] }>>("/interviews/recruiter"),
	create: (body: unknown) =>
		api.post<ApiResponse<{ interview: Interview }>>("/interviews", body),
	update: (id: string, body: unknown) =>
		api.patch<ApiResponse<{ interview: Interview }>>(`/interviews/${id}`, body),
	remove: (id: string) =>
		api.delete<ApiResponse<{ interview: Interview }>>(`/interviews/${id}`),
};

export const adminApi = {
	stats: () =>
		api.get<ApiResponse<Record<string, number | Record<string, number>>>>(
			"/admin/stats",
		),
	users: (params: unknown) =>
		api.get<
			ApiResponse<{
				users: Array<{
					_id: string;
					name: string;
					email: string;
					role: string;
					isActive: boolean;
					createdAt: string;
				}>;
				pagination: Pagination;
			}>
		>("/admin/users", { params }),
	setUserStatus: (id: string, isActive: boolean) =>
		api.patch(`/admin/users/${id}/status`, { isActive }),
	jobs: (params: unknown) =>
		api.get<ApiResponse<{ jobs: Job[]; pagination: Pagination }>>(
			"/admin/jobs",
			{ params },
		),
	setJobStatus: (id: string, status: string) =>
		api.patch(`/admin/jobs/${id}/status`, { status }),
	companies: (params: unknown) =>
		api.get<ApiResponse<{ companies: Company[]; pagination: Pagination }>>(
			"/admin/companies",
			{ params },
		),
	verifyCompany: (id: string, isVerified: boolean) =>
		api.patch(`/admin/companies/${id}/verify`, { isVerified }),
	applications: (params: unknown) =>
		api.get<ApiResponse<{ applications: Application[]; pagination: Pagination }>>(
			"/admin/applications",
			{ params },
		),
};

export const resumeApi = {
	upload: (file: File, onUploadProgress?: (progress: number) => void) => {
		const formData = new FormData();
		formData.append("resume", file);
		return api.post<ApiResponse<ResumeUploadResult>>("/profile/resume/upload", formData, {
			onUploadProgress: (event) =>
				onUploadProgress?.(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
		});
	},
	download: () =>
		api.get<ApiResponse<{ url: string }>>("/profile/resume"),
	analysis: () =>
		api.get<ApiResponse<{ analysis: ResumeAnalysis | null }>>(
			"/profile/resume/analysis",
		),
	retryAnalysis: () =>
		api.post<ApiResponse<{ jobId: string; status: string }>>(
			"/profile/resume/analysis/retry",
		),
	remove: () =>
		api.delete<ApiResponse<unknown>>("/profile/resume"),
};
