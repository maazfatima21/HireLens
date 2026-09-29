# API Overview

Authentication: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.

Profile/company: `GET|PUT /api/profile`, `POST|GET|PATCH /api/company`, `POST|GET|DELETE /api/profile/resume`, and `GET /api/profile/resume/analysis`. Resume analysis returns candidate-facing results only; extracted raw resume text and storage object keys are not returned.

Jobs: `GET /api/jobs`, `GET /api/jobs/search`, `GET /api/jobs/:id`, `POST /api/jobs`, `PATCH /api/jobs/:id`, `PATCH /api/jobs/:id/publish`, `PATCH /api/jobs/:id/close`, `DELETE /api/jobs/:id`, `GET /api/jobs/recruiter/mine`.

Applications: create, candidate history, recruiter applicants, detail/history, status updates, and candidate-owned match generation/retrieval under `/api/applications`.

Application resume access: recruiters can request `GET /api/applications/:applicationId/resume`. The API verifies ownership of the job before issuing a five-minute signed URL. New applications record the resume object key current at submission.

Saved jobs: candidate-only `GET /api/saved-jobs`, `PUT /api/saved-jobs/:jobId`, and `DELETE /api/saved-jobs/:jobId`. Only published jobs are returned or saved.

Notifications: authenticated `GET /api/notifications` returns the latest 100 notices and unread count; `PATCH /api/notifications/:id/read` marks a notice read. Application status and interview changes create in-app candidate notices.

Interviews: `POST /api/interviews`, `GET /api/interviews/my`, `GET /api/interviews/recruiter`, `GET|PATCH|DELETE /api/interviews/:id`.

Admin: stats, users, jobs, companies, and applications under `/api/admin`; user access, job status, and company verification updates are also available there. All require `ADMIN` authorization.

Responses use `{ success, message, data }` where applicable. Passwords, tokens, and cloud credentials are never returned.
