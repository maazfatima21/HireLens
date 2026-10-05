export type Role = "CANDIDATE" | "RECRUITER" | "ADMIN";
export interface User { id: string; name: string; email: string; role: Role }
export interface Resume { fileName: string; fileKey: string; uploadedAt: string }
export interface Experience { company: string; jobTitle: string; startDate: string; endDate?: string; isCurrent: boolean; description?: string }
export interface Education { institution: string; degree: string; fieldOfStudy?: string; startDate?: string; endDate?: string }
export interface CandidateProfile { headline?: string; bio?: string; skills: string[]; experience: Experience[]; education: Education[]; location?: { city?: string; state?: string; country?: string }; resume?: Resume }
export interface ResumeUploadResult { profile: CandidateProfile; jobId?: string; status: string }
export interface ResumeAnalysis { analysisStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"; errorMessage?: string; skills: string[]; experienceSummary?: string; strengths: string[]; areasForImprovement: string[]; suggestedRoles: string[]; professionalSummary?: string; updatedAt: string }
export interface Company { _id: string; name: string; tagline?: string; description?: string; website?: string; industry?: string; location?: { city?: string; state?: string; country?: string }; logoUrl?: string; isVerified: boolean; ownerId?: User }
export interface Job {
	_id: string;
	title: string;
	description: string;
	skills: string[];
	jobType: string;
	workMode: string;
	location?: { city?: string; state?: string; country?: string };
	experienceMin?: number;
	experienceMax?: number;
	salaryMin?: number;
	salaryMax?: number;
	salaryCurrency?: string;
	applicationDeadline?: string;
	status?: string;
	companyId?: Company | {
		name?: string;
		tagline?: string;
		description?: string;
		website?: string;
		industry?: string;
		location?: { city?: string; state?: string; country?: string };
		logoUrl?: string;
	};
}
export type ApplicationStatus = "APPLIED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "SELECTED" | "REJECTED";
export interface Application {
	_id: string;
	status: ApplicationStatus;
	appliedAt: string;
	coverLetter?: string;
	contactPhone?: string;
	linkedinUrl?: string;
	portfolioUrl?: string;
	relevantExperienceYears?: number;
	noticePeriod?: string;
	jobId?: Job;
	candidateId?: User;
}
export interface Notification { _id: string; title: string; message: string; link: string; readAt?: string; createdAt: string }
export interface StatusHistory { status: ApplicationStatus; note?: string; createdAt: string; changedBy?: User }
export interface JobMatch { matchScore: number; matchedSkills: string[]; missingSkills: string[]; experienceMatch: boolean; recommendations: string[]; summary: string; createdAt: string }
export interface Interview { _id: string; applicationId: string; candidateId: string; recruiterId: string; scheduledAt: string; durationMinutes: number; meetingUrl?: string; notes?: string; status: "SCHEDULED" | "COMPLETED" | "CANCELLED" }
export interface Pagination { page: number; limit: number; total: number; totalPages: number }
export interface ApiResponse<T> { success: boolean; message: string; data: T }
