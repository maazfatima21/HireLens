import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { Shell, Home, Jobs, JobDetail, Login, Register, ResumePage, AdminDashboard } from "./pages/pages";
import { AboutPage, DataAndAIPage, EmployersPage } from "./pages/public-pages";
import { AdminApplicationsPage, AdminCompaniesPage, AdminJobsPage, AdminUsersPage, CandidateApplicationPage, CandidateApplicationsPage, CandidateDashboardPage, CandidateProfilePage, InterviewsPage, NotificationsPage, NotFoundPage, RecruiterApplicantResumePage, RecruiterApplicationPage, RecruiterCandidatesPage, RecruiterCompanyPage, RecruiterDashboardPage, RecruiterJobEditorPage, RecruiterJobsPage, SavedJobsPage } from "./pages/workspaces";
import { ProtectedRoute, RoleRoute } from "./routes/guards";
const queryClient = new QueryClient();
export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<BrowserRouter>
					<Shell>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/jobs" element={<Jobs />} />
							<Route path="/jobs/:id" element={<JobDetail />} />
							<Route path="/about" element={<AboutPage />} />
							<Route path="/employers" element={<EmployersPage />} />
							<Route path="/data-and-ai" element={<DataAndAIPage />} />
							<Route path="/login" element={<Login />} />
							<Route path="/register" element={<Register />} />
							<Route element={<ProtectedRoute />}>
								<Route path="/notifications" element={<NotificationsPage />} />
								<Route element={<RoleRoute role="CANDIDATE" />}>
									<Route path="/dashboard" element={<CandidateDashboardPage />} />
									<Route path="/profile" element={<CandidateProfilePage />} />
									<Route path="/resume" element={<ResumePage />} />
									<Route path="/applications" element={<CandidateApplicationsPage />} />
									<Route path="/saved-jobs" element={<SavedJobsPage />} />
									<Route path="/applications/:id" element={<CandidateApplicationPage />} />
									<Route path="/interviews" element={<InterviewsPage />} />
								</Route>
								<Route element={<RoleRoute role="RECRUITER" />}>
									<Route path="/recruiter/dashboard" element={<RecruiterDashboardPage />} />
									<Route path="/recruiter/company" element={<RecruiterCompanyPage />} />
									<Route path="/recruiter/jobs" element={<RecruiterJobsPage />} />
									<Route path="/recruiter/jobs/new" element={<RecruiterJobEditorPage />} />
									<Route path="/recruiter/jobs/:id" element={<RecruiterJobEditorPage />} />
									<Route path="/recruiter/candidates" element={<RecruiterCandidatesPage />} />
									<Route path="/recruiter/applications/:id" element={<RecruiterApplicationPage />} />
									<Route path="/recruiter/applications/:id/resume" element={<RecruiterApplicantResumePage />} />
									<Route path="/recruiter/interviews" element={<InterviewsPage />} />
								</Route>
								<Route element={<RoleRoute role="ADMIN" />}>
									<Route path="/admin" element={<AdminDashboard />} />
									<Route path="/admin/users" element={<AdminUsersPage />} />
									<Route path="/admin/jobs" element={<AdminJobsPage />} />
									<Route path="/admin/companies" element={<AdminCompaniesPage />} />
									<Route path="/admin/applications" element={<AdminApplicationsPage />} />
								</Route>
							</Route>
							<Route path="*" element={<NotFoundPage />} />
						</Routes>
					</Shell>
				</BrowserRouter>
			</AuthProvider>
		</QueryClientProvider>
	);
}
