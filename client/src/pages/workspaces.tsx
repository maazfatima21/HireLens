import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, applicationsApi, companyApi, interviewsApi, jobsApi, notificationsApi, profileApi, resumeApi, savedJobsApi } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, Empty, Loading } from "../components/ui";
import type { Application, ApplicationStatus, CandidateProfile, Company, Education, Experience, Interview, Job, StatusHistory } from "../types";
import { JobCard } from "../components/JobCard";

const applicationStatuses: ApplicationStatus[] = ["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "SELECTED", "REJECTED"];
const workModes = ["ONSITE", "REMOTE", "HYBRID"];
const jobTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"];

function errorText(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function PageTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children}</div>;
}

function RequestState({ loading, error, children }: { loading: boolean; error: boolean; children: ReactNode }) {
  if (loading) return <Loading />;
  if (error) return <p className="error" role="alert">Could not load this information. Please try again.</p>;
  return <>{children}</>;
}

function PaginationBar({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return <div className="pagination"><Button disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button><span>Page {page} of {totalPages}</span><Button disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</Button></div>;
}

function formattedDate(value?: string) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function emptyProfile(): CandidateProfile {
  return { headline: "", bio: "", skills: [], experience: [], education: [], location: {} };
}

type ExperienceDraft = Omit<Experience, "startDate" | "endDate"> & { startDate: string; endDate: string };
type EducationDraft = Omit<Education, "startDate" | "endDate"> & { startDate: string; endDate: string };
type ProfileDraft = { headline: string; bio: string; skills: string; city: string; state: string; country: string; experience: ExperienceDraft[]; education: EducationDraft[] };

function profileDraft(profile: CandidateProfile): ProfileDraft {
  return {
    headline: profile.headline || "",
    bio: profile.bio || "",
    skills: (profile.skills || []).join(", "),
    city: profile.location?.city || "",
    state: profile.location?.state || "",
    country: profile.location?.country || "",
    experience: (profile.experience || []).map((item) => ({ ...item, startDate: item.startDate?.slice(0, 10) || "", endDate: item.endDate?.slice(0, 10) || "" })),
    education: (profile.education || []).map((item) => ({ ...item, startDate: item.startDate?.slice(0, 10) || "", endDate: item.endDate?.slice(0, 10) || "" })),
  };
}

export function CandidateProfilePage() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileApi.get().then((r) => r.data.data.profile).catch((error) => {
    if ((error as { response?: { status?: number } }).response?.status === 404) return emptyProfile();
    throw error;
  }) });
  const [draft, setDraft] = useState<ProfileDraft>(profileDraft(emptyProfile()));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (profile.data) setDraft(profileDraft(profile.data)); }, [profile.data]);
  const save = useMutation({
    mutationFn: () => profileApi.update({
      headline: draft.headline.trim(),
      bio: draft.bio.trim(),
      skills: draft.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
      location: { city: draft.city.trim(), state: draft.state.trim(), country: draft.country.trim() },
      experience: draft.experience.filter((item) => item.company.trim() && item.jobTitle.trim() && item.startDate).map((item) => ({ company: item.company.trim(), jobTitle: item.jobTitle.trim(), startDate: item.startDate, ...(item.endDate && !item.isCurrent ? { endDate: item.endDate } : {}), isCurrent: item.isCurrent, description: item.description?.trim() || "" })),
      education: draft.education.filter((item) => item.institution.trim() && item.degree.trim()).map((item) => ({ institution: item.institution.trim(), degree: item.degree.trim(), fieldOfStudy: item.fieldOfStudy?.trim(), ...(item.startDate ? { startDate: item.startDate } : {}), ...(item.endDate ? { endDate: item.endDate } : {}) })),
    }),
    onSuccess: (result) => { queryClient.setQueryData(["profile"], result.data.data.profile); setNotice("Profile saved."); setError(""); },
    onError: (reason) => { setError(errorText(reason, "Profile could not be saved.")); setNotice(""); },
  });
  const updateExperience = (index: number, changes: Partial<ExperienceDraft>) => setDraft((current) => ({ ...current, experience: current.experience.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) }));
  const updateEducation = (index: number, changes: Partial<EducationDraft>) => setDraft((current) => ({ ...current, education: current.education.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) }));
  return <section className="page"><PageTitle eyebrow="CANDIDATE PROFILE" title="Your profile"><p className="muted">Keep your experience and skills current for every application.</p></PageTitle>
    <RequestState loading={profile.isLoading} error={profile.isError}><form className="workspace-form" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
      <Card><h2>About you</h2><label>Professional headline<input maxLength={150} value={draft.headline} onChange={(event) => setDraft({ ...draft, headline: event.target.value })} /></label><label>Summary<textarea maxLength={2000} rows={5} value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} /></label><label>Skills, separated by commas<input value={draft.skills} onChange={(event) => setDraft({ ...draft, skills: event.target.value })} /></label><div className="form-grid"><label>City<input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></label><label>State or region<input value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })} /></label><label>Country<input value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} /></label></div></Card>
      <Card><div className="section-row"><h2>Experience</h2><Button type="button" onClick={() => setDraft({ ...draft, experience: [...draft.experience, { company: "", jobTitle: "", startDate: "", endDate: "", isCurrent: false, description: "" }] })}>Add experience</Button></div>{draft.experience.length === 0 && <Empty text="Add your work history when you're ready." />}{draft.experience.map((item, index) => <div className="form-record" key={`experience-${index}`}><div className="form-grid"><label>Company<input required value={item.company} onChange={(event) => updateExperience(index, { company: event.target.value })} /></label><label>Job title<input required value={item.jobTitle} onChange={(event) => updateExperience(index, { jobTitle: event.target.value })} /></label><label>Start date<input required type="date" value={item.startDate} onChange={(event) => updateExperience(index, { startDate: event.target.value })} /></label><label>End date<input disabled={item.isCurrent} type="date" value={item.endDate} onChange={(event) => updateExperience(index, { endDate: event.target.value })} /></label></div><label className="check-label"><input type="checkbox" checked={item.isCurrent} onChange={(event) => updateExperience(index, { isCurrent: event.target.checked, endDate: "" })} /> I currently work here</label><label>Description<textarea rows={3} value={item.description || ""} onChange={(event) => updateExperience(index, { description: event.target.value })} /></label><button className="text-link" type="button" onClick={() => setDraft({ ...draft, experience: draft.experience.filter((_, itemIndex) => itemIndex !== index) })}>Remove experience</button></div>)}</Card>
      <Card><div className="section-row"><h2>Education</h2><Button type="button" onClick={() => setDraft({ ...draft, education: [...draft.education, { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" }] })}>Add education</Button></div>{draft.education.length === 0 && <Empty text="Add education or training." />}{draft.education.map((item, index) => <div className="form-record" key={`education-${index}`}><div className="form-grid"><label>Institution<input required value={item.institution} onChange={(event) => updateEducation(index, { institution: event.target.value })} /></label><label>Degree<input required value={item.degree} onChange={(event) => updateEducation(index, { degree: event.target.value })} /></label><label>Field of study<input value={item.fieldOfStudy || ""} onChange={(event) => updateEducation(index, { fieldOfStudy: event.target.value })} /></label><label>Start date<input type="date" value={item.startDate} onChange={(event) => updateEducation(index, { startDate: event.target.value })} /></label><label>End date<input type="date" value={item.endDate} onChange={(event) => updateEducation(index, { endDate: event.target.value })} /></label></div><button className="text-link" type="button" onClick={() => setDraft({ ...draft, education: draft.education.filter((_, itemIndex) => itemIndex !== index) })}>Remove education</button></div>)}</Card>
      {notice && <p className="success" role="status">{notice}</p>}{error && <p className="error" role="alert">{error}</p>}<Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving..." : "Save profile"}</Button>
    </form></RequestState>
  </section>;
}

export function CandidateApplicationsPage() {
  const query = useQuery({ queryKey: ["applications", "mine"], queryFn: () => applicationsApi.mine().then((r) => r.data.data.applications) });
  const interviews = useQuery({ queryKey: ["interviews", "mine"], queryFn: () => interviewsApi.mine().then((r) => r.data.data.interviews) });
  return <section className="page"><PageTitle eyebrow="CANDIDATE SPACE" title="Applications"><p className="muted">Track each application and the next step in its process.</p></PageTitle><RequestState loading={query.isLoading} error={query.isError}>{query.data?.length ? <div className="workspace-list">{query.data.map((application) => <Card key={application._id}><div className="section-row"><div><h2>{application.jobId?.title || "Role"}</h2><p className="muted">{application.jobId?.companyId && "name" in application.jobId.companyId ? application.jobId.companyId.name : "Company"} · Applied {formattedDate(application.appliedAt)}</p></div><Badge>{application.status.replaceAll("_", " ")}</Badge></div><Link className="text-link" to={`/applications/${application._id}`}>View application</Link></Card>)}</div> : <Empty text="You haven't applied to any roles yet." />}</RequestState><h2 className="subheading">Interviews</h2><RequestState loading={interviews.isLoading} error={interviews.isError}>{interviews.data?.length ? <div className="table-wrap"><table><thead><tr><th>When</th><th>Duration</th><th>Status</th><th>Meeting</th></tr></thead><tbody>{interviews.data.map((interview) => <tr key={interview._id}><td>{formattedDate(interview.scheduledAt)} · {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td><td>{interview.durationMinutes} min</td><td>{interview.status}</td><td>{interview.meetingUrl ? <a href={interview.meetingUrl} target="_blank" rel="noreferrer">Join interview</a> : "Not provided"}</td></tr>)}</tbody></table></div> : <Empty text="No interviews scheduled." />}</RequestState></section>;
}

export function CandidateApplicationPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const details = useQuery({ queryKey: ["application", id], queryFn: () => applicationsApi.detail(id).then((r) => r.data.data) });
  const match = useQuery({ queryKey: ["application-match", id], queryFn: () => applicationsApi.match(id).then((r) => r.data.data.match), enabled: Boolean(id) });
  const generateMatch = useMutation({ mutationFn: () => applicationsApi.createMatch(id), onSuccess: (result) => queryClient.setQueryData(["application-match", id], result.data.data.match) });
  const application = details.data?.application;
  return <section className="page narrow"><Link className="back" to="/applications">← Applications</Link><RequestState loading={details.isLoading} error={details.isError}>{application && <><PageTitle eyebrow="APPLICATION DETAIL" title={application.jobId?.title || "Application"}><p className="muted">{application.jobId?.companyId && "name" in application.jobId.companyId ? application.jobId.companyId.name : "Company"} · Applied {formattedDate(application.appliedAt)}</p></PageTitle><Card><div className="section-row"><h2>Current status</h2><Badge>{application.status.replaceAll("_", " ")}</Badge></div>{application.coverLetter && <><h3>Your cover letter</h3><p className="body-copy">{application.coverLetter}</p></>}</Card><Card><h2>Status history</h2>{details.data?.history.length ? <ol className="timeline">{details.data.history.map((item: StatusHistory, index: number) => <li key={`${item.status}-${item.createdAt}-${index}`}><strong>{item.status.replaceAll("_", " ")}</strong><span>{formattedDate(item.createdAt)}</span>{item.note && <p>{item.note}</p>}</li>)}</ol> : <Empty text="No status updates yet." />}</Card><Card><div className="section-row"><div><h2>Resume–job match assistance</h2><p className="muted">Informational comparison to help you review role alignment; not a hiring prediction.</p></div>{!match.data && <Button disabled={generateMatch.isPending} onClick={() => generateMatch.mutate()}>{generateMatch.isPending ? "Generating..." : "Generate match"}</Button>}</div>{match.isLoading && <Loading />}{match.isError && (match.error as { response?: { status?: number } }).response?.status !== 404 && <p className="error">Match information could not be loaded.</p>}{generateMatch.isError && <p className="error" role="alert">{errorText(generateMatch.error, "Match could not be generated. Check that resume processing is complete.")}</p>}{match.data && <div className="match-result"><strong className="match-score">{match.data.matchScore}%</strong><p>{match.data.summary}</p><div className="form-grid"><div><h3>Matched skills</h3><div className="tags">{match.data.matchedSkills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div></div><div><h3>Skills to develop</h3><div className="tags">{match.data.missingSkills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div></div></div><h3>Suggestions</h3><ul>{match.data.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul></div>}</Card></>}</RequestState></section>;
}

type CompanyDraft = { name: string; tagline: string; description: string; website: string; industry: string; companySize: string; city: string; state: string; country: string; logoUrl: string };
const emptyCompany: CompanyDraft = { name: "", tagline: "", description: "", website: "", industry: "", companySize: "", city: "", state: "", country: "", logoUrl: "" };
function companyDraft(company?: Company | null): CompanyDraft {
  return company ? { name: company.name || "", tagline: company.tagline || "", description: company.description || "", website: company.website || "", industry: company.industry || "", companySize: company.companySize || "", city: company.location?.city || "", state: company.location?.state || "", country: company.location?.country || "", logoUrl: company.logoUrl || "" } : emptyCompany;
}

export function RecruiterCompanyPage() {
  const queryClient = useQueryClient();
  const company = useQuery({ queryKey: ["company"], queryFn: () => companyApi.get().then((r) => r.data.data.company).catch((error) => {
    if ((error as { response?: { status?: number } }).response?.status === 404) return null;
    throw error;
  }) });
  const [draft, setDraft] = useState<CompanyDraft>(emptyCompany);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { setDraft(companyDraft(company.data)); }, [company.data?._id]);
  const save = useMutation({ mutationFn: () => {
    const body = { name: draft.name.trim(), tagline: draft.tagline.trim(), description: draft.description.trim(), ...(draft.website.trim() ? { website: draft.website.trim() } : {}), industry: draft.industry.trim(), companySize: draft.companySize.trim(), location: { city: draft.city.trim(), state: draft.state.trim(), country: draft.country.trim() }, ...(draft.logoUrl.trim() ? { logoUrl: draft.logoUrl.trim() } : {}) };
    return company.data ? companyApi.update(body) : companyApi.create(body);
  }, onSuccess: (result) => { queryClient.setQueryData(["company"], result.data.data.company); setNotice("Company details saved."); setError(""); }, onError: (reason) => { setError(errorText(reason, "Company could not be saved.")); setNotice(""); } });
  return <section className="page narrow"><PageTitle eyebrow="RECRUITER SPACE" title="Company profile"><p className="muted">Candidates see these details on your published roles.</p></PageTitle><RequestState loading={company.isLoading} error={company.isError}><form className="workspace-form" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}><Card><div className="section-row"><h2>Organization details</h2>{company.data && <Badge>{company.data.isVerified ? "Verified" : "Verification pending"}</Badge>}</div><label>Company name<input required minLength={2} maxLength={150} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label>Tagline<input maxLength={160} placeholder="A short company slogan or value statement" value={draft.tagline} onChange={(event) => setDraft({ ...draft, tagline: event.target.value })} /></label><label>About the company<textarea rows={5} maxLength={3000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label><div className="form-grid"><label>Industry<input value={draft.industry} onChange={(event) => setDraft({ ...draft, industry: event.target.value })} /></label><label>Company size<input placeholder="e.g. 50–200" value={draft.companySize} onChange={(event) => setDraft({ ...draft, companySize: event.target.value })} /></label><label>Website<input type="url" value={draft.website} onChange={(event) => setDraft({ ...draft, website: event.target.value })} /></label><label>Logo URL<input type="url" value={draft.logoUrl} onChange={(event) => setDraft({ ...draft, logoUrl: event.target.value })} /></label><label>City<input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></label><label>State or region<input value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })} /></label><label>Country<input value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} /></label></div></Card>{notice && <p className="success" role="status">{notice}</p>}{error && <p className="error" role="alert">{error}</p>}<Button disabled={save.isPending}>{save.isPending ? "Saving..." : company.data ? "Save company" : "Create company"}</Button>{company.data && <Link className="text-link" to="/recruiter/jobs/new">Create a job</Link>}</form></RequestState></section>;
}

export function RecruiterJobsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["recruiter-jobs"], queryFn: () => jobsApi.mine().then((r) => r.data.data.jobs) });
  const change = useMutation({ mutationFn: async ({ id, action }: { id: string; action: "publish" | "close" | "remove" }) => action === "publish" ? jobsApi.publish(id) : action === "close" ? jobsApi.close(id) : jobsApi.remove(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] }) });
  return <section className="page"><PageTitle eyebrow="RECRUITER SPACE" title="Job management"><p className="muted">Create roles, publish openings, and keep listings current.</p></PageTitle><div className="page-actions"><Link className="button" to="/recruiter/jobs/new">Create a job</Link><Link className="text-link" to="/recruiter/company">Company profile</Link><Link className="text-link" to="/recruiter/candidates">Review applicants</Link></div><RequestState loading={query.isLoading} error={query.isError}>{query.data?.length ? <div className="workspace-list">{query.data.map((job) => <Card key={job._id}><div className="section-row"><div><h2>{job.title}</h2><p className="muted">{job.jobType.replaceAll("_", " ")} · {job.workMode} · {job.skills.join(", ")}</p></div><Badge>{job.status || "DRAFT"}</Badge></div><div className="row page-actions"><Link className="text-link" to={`/recruiter/jobs/${job._id}`}>Edit job</Link><Link className="text-link" to={`/recruiter/candidates?job=${job._id}`}>Applicants</Link>{job.status === "DRAFT" && <Button disabled={change.isPending} onClick={() => change.mutate({ id: job._id, action: "publish" })}>Publish</Button>}{job.status === "PUBLISHED" && <Button disabled={change.isPending} onClick={() => change.mutate({ id: job._id, action: "close" })}>Close listing</Button>}{job.status !== "PUBLISHED" && <button className="text-link" type="button" disabled={change.isPending} onClick={() => { if (window.confirm(`Delete “${job.title}”?`)) change.mutate({ id: job._id, action: "remove" }); }}>Delete</button>}</div></Card>)}</div> : <Empty text="No jobs yet. Create your first role to start receiving applications." />}{change.isError && <p className="error" role="alert">{errorText(change.error, "Job action failed.")}</p>}</RequestState></section>;
}

type JobDraft = { title: string; description: string; skills: string; jobType: string; workMode: string; city: string; state: string; country: string; experienceMin: string; experienceMax: string; salaryMin: string; salaryMax: string; salaryCurrency: string; applicationDeadline: string };
const emptyJob: JobDraft = { title: "", description: "", skills: "", jobType: "FULL_TIME", workMode: "REMOTE", city: "", state: "", country: "", experienceMin: "", experienceMax: "", salaryMin: "", salaryMax: "", salaryCurrency: "Rs.", applicationDeadline: "" };
function jobDraft(job?: Job): JobDraft {
  return job ? { title: job.title, description: job.description, skills: job.skills.join(", "), jobType: job.jobType, workMode: job.workMode, city: job.location?.city || "", state: job.location?.state || "", country: job.location?.country || "", experienceMin: job.experienceMin?.toString() || "", experienceMax: job.experienceMax?.toString() || "", salaryMin: job.salaryMin?.toString() || "", salaryMax: job.salaryMax?.toString() || "", salaryCurrency: job.salaryCurrency || "Rs.", applicationDeadline: job.applicationDeadline?.slice(0, 10) || "" } : emptyJob;
}

export function RecruiterJobEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const company = useQuery({ queryKey: ["company"], queryFn: () => companyApi.get().then((r) => r.data.data.company) });
  const jobs = useQuery({ queryKey: ["recruiter-jobs"], queryFn: () => jobsApi.mine().then((r) => r.data.data.jobs), enabled: Boolean(id) });
  const existing = jobs.data?.find((job) => job._id === id);
  const [draft, setDraft] = useState<JobDraft>(emptyJob);
  const [error, setError] = useState("");
  useEffect(() => { if (existing) setDraft(jobDraft(existing)); }, [existing]);
  const save = useMutation({ mutationFn: () => {
    const numeric = (value: string) => value.trim() ? Number(value) : undefined;
    const body = { title: draft.title.trim(), description: draft.description.trim(), skills: draft.skills.split(",").map((skill) => skill.trim()).filter(Boolean), jobType: draft.jobType, workMode: draft.workMode, location: { city: draft.city.trim(), state: draft.state.trim(), country: draft.country.trim() }, experienceMin: numeric(draft.experienceMin), experienceMax: numeric(draft.experienceMax), salaryMin: numeric(draft.salaryMin), salaryMax: numeric(draft.salaryMax), salaryCurrency: draft.salaryCurrency.trim() || "Rs.", ...(draft.applicationDeadline ? { applicationDeadline: draft.applicationDeadline } : {}) };
    return id ? jobsApi.update(id, body) : jobsApi.create(body);
  }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] }); navigate("/recruiter/jobs"); }, onError: (reason) => setError(errorText(reason, "Job could not be saved.")) });
  if (company.isLoading || (id && jobs.isLoading)) return <section className="page"><Loading /></section>;
  if (company.isError || jobs.isError) return <section className="page"><p className="error">Could not load the job editor.</p></section>;
  if (id && !existing && jobs.data) return <section className="page"><p className="error">Job not found.</p><Link to="/recruiter/jobs">Back to jobs</Link></section>;
  return <section className="page narrow"><Link className="back" to="/recruiter/jobs">← Job management</Link><PageTitle eyebrow="RECRUITER SPACE" title={id ? "Edit job" : "Create a job"} />{!company.data && <Card><p>Add your company profile before creating jobs.</p><Link className="button" to="/recruiter/company">Set up company</Link></Card>}{company.data && <form className="workspace-form" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}><Card><label>Job title<input required minLength={2} maxLength={150} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>Description<textarea required minLength={20} maxLength={10000} rows={8} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label><label>Skills, separated by commas<input required value={draft.skills} onChange={(event) => setDraft({ ...draft, skills: event.target.value })} /></label><div className="form-grid"><label>Employment type<select value={draft.jobType} onChange={(event) => setDraft({ ...draft, jobType: event.target.value })}>{jobTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label><label>Work mode<select value={draft.workMode} onChange={(event) => setDraft({ ...draft, workMode: event.target.value })}>{workModes.map((mode) => <option key={mode}>{mode}</option>)}</select></label><label>City<input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></label><label>State or region<input value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })} /></label><label>Country<input value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} /></label><label>Minimum experience (years)<input type="number" min="0" value={draft.experienceMin} onChange={(event) => setDraft({ ...draft, experienceMin: event.target.value })} /></label><label>Maximum experience (years)<input type="number" min="0" value={draft.experienceMax} onChange={(event) => setDraft({ ...draft, experienceMax: event.target.value })} /></label><label>Minimum salary<input type="number" min="0" value={draft.salaryMin} onChange={(event) => setDraft({ ...draft, salaryMin: event.target.value })} /></label><label>Maximum salary<input type="number" min="0" value={draft.salaryMax} onChange={(event) => setDraft({ ...draft, salaryMax: event.target.value })} /></label><label>Currency code<input maxLength={3} value={draft.salaryCurrency} onChange={(event) => setDraft({ ...draft, salaryCurrency: event.target.value })} /></label><label>Application deadline<input type="date" value={draft.applicationDeadline} onChange={(event) => setDraft({ ...draft, applicationDeadline: event.target.value })} /></label></div></Card>{error && <p className="error" role="alert">{error}</p>}<Button disabled={save.isPending}>{save.isPending ? "Saving..." : id ? "Save changes" : "Save as draft"}</Button></form>}</section>;
}

export function RecruiterCandidatesPage() {
  const params = new URLSearchParams(location.search);
  const [status, setStatus] = useState("");
  const query = useQuery({ queryKey: ["recruiter-applications"], queryFn: () => applicationsApi.recruiter().then((r) => r.data.data.applications) });
  const filtered = (query.data || []).filter((application) => (!status || application.status === status) && (!params.get("job") || (application.jobId as Job)?._id === params.get("job")));
  return <section className="page"><PageTitle eyebrow="RECRUITER SPACE" title="Applicants"><p className="muted">Review applications across your open and previous roles.</p></PageTitle><div className="filters"><select aria-label="Filter by application status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{applicationStatuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></div><RequestState loading={query.isLoading} error={query.isError}>{filtered.length ? <div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Role</th><th>Applied</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map((application) => <tr key={application._id}><td>{application.candidateId && typeof application.candidateId !== "string" ? application.candidateId.name : "Candidate"}<small>{application.candidateId && typeof application.candidateId !== "string" ? application.candidateId.email : ""}</small></td><td>{(application.jobId as Job | undefined)?.title || "Role"}</td><td>{formattedDate(application.appliedAt)}</td><td><Badge>{application.status.replaceAll("_", " ")}</Badge></td><td><Link className="text-link" to={`/recruiter/applications/${application._id}`}>Review</Link></td></tr>)}</tbody></table></div> : <Empty text="No applications match this filter." />}</RequestState><div className="page-actions"><Link className="text-link" to="/recruiter/interviews">Manage interviews</Link></div></section>;
}

type InterviewDraft = { scheduledAt: string; durationMinutes: string; meetingUrl: string; notes: string };
const emptyInterview: InterviewDraft = { scheduledAt: "", durationMinutes: "30", meetingUrl: "", notes: "" };

export function RecruiterApplicationPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const detailQuery = useQuery({ queryKey: ["application", id], queryFn: () => applicationsApi.detail(id).then((r) => r.data.data) });
  const detail = { ...detailQuery, data: detailQuery.data ?? { application: undefined, history: [] as StatusHistory[] } };
  const [status, setStatus] = useState<ApplicationStatus>("UNDER_REVIEW");
  const [note, setNote] = useState("");
  const [interview, setInterview] = useState<InterviewDraft>(emptyInterview);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const updateStatus = useMutation({ mutationFn: () => applicationsApi.updateStatus(id, { status, note: note.trim() || undefined }), onSuccess: async () => { setNotice("Application status updated."); await queryClient.invalidateQueries({ queryKey: ["application", id] }); await queryClient.invalidateQueries({ queryKey: ["recruiter-applications"] }); }, onError: (reason) => setError(errorText(reason, "Status update failed.")) });
  const schedule = useMutation({ mutationFn: () => interviewsApi.create({ applicationId: id, scheduledAt: new Date(interview.scheduledAt).toISOString(), durationMinutes: Number(interview.durationMinutes), ...(interview.meetingUrl ? { meetingUrl: interview.meetingUrl } : {}), notes: interview.notes.trim() }), onSuccess: async () => { setNotice("Interview scheduled."); setInterview(emptyInterview); await queryClient.invalidateQueries({ queryKey: ["interviews"] }); await queryClient.invalidateQueries({ queryKey: ["application", id] }); }, onError: (reason) => setError(errorText(reason, "Interview could not be scheduled.")) });
  const application = detail.data?.application;
  useEffect(() => { if (application) setStatus(application.status === "APPLIED" ? "UNDER_REVIEW" : application.status); }, [application]);
  const candidate = application?.candidateId && typeof application.candidateId !== "string" ? application.candidateId : undefined;
  return <section className="page narrow"><Link className="back" to="/recruiter/candidates">← Applicants</Link><RequestState loading={detail.isLoading} error={detail.isError}>{application && <><PageTitle eyebrow="APPLICATION REVIEW" title={candidate?.name || "Candidate"}><p className="muted">{candidate?.email} · {application.jobId?.title}</p></PageTitle><Card><h2>Application</h2><p><strong>Status:</strong> {application.status.replaceAll("_", " ")}</p>{application.coverLetter && <><h3>Cover letter</h3><p className="body-copy">{application.coverLetter}</p></>}<p className="muted">Submitted {formattedDate(application.appliedAt)}</p></Card><Card><h2>Update status</h2><form className="workspace-form" onSubmit={(event) => { event.preventDefault(); updateStatus.mutate(); }}><label>Status<select value={status} onChange={(event) => setStatus(event.target.value as ApplicationStatus)}>{applicationStatuses.filter((value) => value !== "APPLIED").map((value) => <option key={value}>{value}</option>)}</select></label><label>Note for the status history<textarea maxLength={1000} rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></label><Button disabled={updateStatus.isPending}>{updateStatus.isPending ? "Updating..." : "Update status"}</Button></form></Card><Card><h2>Schedule an interview</h2><form className="workspace-form" onSubmit={(event) => { event.preventDefault(); schedule.mutate(); }}><label>Date and time<input required type="datetime-local" min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} value={interview.scheduledAt} onChange={(event) => setInterview({ ...interview, scheduledAt: event.target.value })} /></label><label>Duration<select value={interview.durationMinutes} onChange={(event) => setInterview({ ...interview, durationMinutes: event.target.value })}>{[15, 30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label><label>Meeting URL<input type="url" value={interview.meetingUrl} onChange={(event) => setInterview({ ...interview, meetingUrl: event.target.value })} /></label><label>Notes<textarea rows={3} maxLength={5000} value={interview.notes} onChange={(event) => setInterview({ ...interview, notes: event.target.value })} /></label><Button disabled={schedule.isPending}>{schedule.isPending ? "Scheduling..." : "Schedule interview"}</Button></form></Card><Card><h2>Status history</h2>{detail.data.history.length ? <ol className="timeline">{detail.data.history.map((item: StatusHistory, index: number) => <li key={`${item.status}-${index}`}><strong>{item.status.replaceAll("_", " ")}</strong><span>{formattedDate(item.createdAt)}</span>{item.note && <p>{item.note}</p>}</li>)}</ol> : <Empty text="No status history." />}</Card>{notice && <p className="success" role="status">{notice}</p>}{error && <p className="error" role="alert">{error}</p>}</>}</RequestState></section>;
}

export function InterviewsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const recruiter = user?.role === "RECRUITER";
  const query = useQuery({ queryKey: ["interviews", recruiter ? "recruiter" : "mine"], queryFn: () => (recruiter ? interviewsApi.recruiter() : interviewsApi.mine()).then((r) => r.data.data.interviews) });
  const change = useMutation({ mutationFn: ({ id, action }: { id: string; action: "complete" | "cancel" }) => action === "cancel" ? interviewsApi.remove(id) : interviewsApi.update(id, { status: "COMPLETED" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interviews"] }) });
  return <section className="page"><PageTitle eyebrow={recruiter ? "RECRUITER SPACE" : "CANDIDATE SPACE"} title="Interviews"><p className="muted">{recruiter ? "Keep scheduled conversations up to date." : "Your scheduled conversations and meeting links."}</p></PageTitle><RequestState loading={query.isLoading} error={query.isError}>{query.data?.length ? <div className="table-wrap"><table><thead><tr><th>Date and time</th><th>Duration</th><th>Status</th><th>Meeting</th>{recruiter && <th>Actions</th>}</tr></thead><tbody>{query.data.map((item: Interview) => <tr key={item._id}><td>{formattedDate(item.scheduledAt)} · {new Date(item.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}<small>{item.notes}</small></td><td>{item.durationMinutes} min</td><td><Badge>{item.status}</Badge></td><td>{item.meetingUrl ? <a href={item.meetingUrl} target="_blank" rel="noreferrer">Open meeting</a> : "No link"}</td>{recruiter && <td className="row"><Link className="text-link" to={`/recruiter/applications/${item.applicationId}`}>Application</Link>{item.status === "SCHEDULED" && <><button className="text-link" type="button" onClick={() => change.mutate({ id: item._id, action: "complete" })}>Complete</button><button className="text-link" type="button" onClick={() => change.mutate({ id: item._id, action: "cancel" })}>Cancel</button></>}</td>}</tr>)}</tbody></table></div> : <Empty text="No interviews scheduled." />}{change.isError && <p className="error">{errorText(change.error, "Interview could not be updated.")}</p>}</RequestState></section>;
}

export function RecruiterDashboardPage() {
  const jobs = useQuery({ queryKey: ["recruiter-jobs"], queryFn: () => jobsApi.mine().then((r) => r.data.data.jobs) });
  const applications = useQuery({ queryKey: ["recruiter-applications"], queryFn: () => applicationsApi.recruiter().then((r) => r.data.data.applications) });
  const interviews = useQuery({ queryKey: ["interviews", "recruiter"], queryFn: () => interviewsApi.recruiter().then((r) => r.data.data.interviews) });
  return <section className="page"><PageTitle eyebrow="RECRUITER SPACE" title="Hiring overview"><p className="muted">Your roles, applicants, and upcoming conversations.</p></PageTitle><div className="stat-grid"><Card><span>All jobs</span><strong>{jobs.data?.length ?? "—"}</strong><Link className="text-link" to="/recruiter/jobs">Manage roles</Link></Card><Card><span>Applications</span><strong>{applications.data?.length ?? "—"}</strong><Link className="text-link" to="/recruiter/candidates">Review applicants</Link></Card><Card><span>Scheduled interviews</span><strong>{interviews.data?.filter((item) => item.status === "SCHEDULED").length ?? "—"}</strong><Link className="text-link" to="/recruiter/interviews">Manage interviews</Link></Card></div><div className="page-actions"><Link className="button" to="/recruiter/jobs/new">Create a job</Link><Link className="text-link" to="/recruiter/company">Company profile</Link></div></section>;
}

export function CandidateDashboardPage() {
  const { user } = useAuth();
  const applications = useQuery({ queryKey: ["applications", "mine"], queryFn: () => applicationsApi.mine().then((r) => r.data.data.applications) });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileApi.get().then((r) => r.data.data.profile).catch((error) => (error as { response?: { status?: number } }).response?.status === 404 ? emptyProfile() : Promise.reject(error)) });
  const interviews = useQuery({ queryKey: ["interviews", "mine"], queryFn: () => interviewsApi.mine().then((r) => r.data.data.interviews) });
  return <section className="page"><PageTitle eyebrow="CANDIDATE SPACE" title={`Good to see you, ${user?.name || "candidate"}.`}><p className="muted">A clear view of your profile and active applications.</p></PageTitle><div className="stat-grid"><Card><span>Applications</span><strong>{applications.data?.length ?? "—"}</strong><Link className="text-link" to="/applications">View applications</Link></Card><Card><span>Profile</span><strong>{profile.data?.headline || "Not completed"}</strong><Link className="text-link" to="/profile">Edit profile</Link></Card><Card><span>Resume</span><strong>{profile.data?.resume ? "Uploaded" : "Not uploaded"}</strong><Link className="text-link" to="/resume">Manage resume</Link></Card><Card><span>Interviews</span><strong>{interviews.data?.filter((item) => item.status === "SCHEDULED").length ?? "—"}</strong><Link className="text-link" to="/interviews">View interviews</Link></Card></div><h2 className="subheading">Recent applications</h2>{applications.isLoading ? <Loading /> : applications.data?.slice(0, 5).map((item) => <Card key={item._id}><div className="section-row"><div><h3>{item.jobId?.title || "Role"}</h3><p className="muted">Applied {formattedDate(item.appliedAt)}</p></div><Badge>{item.status.replaceAll("_", " ")}</Badge></div><Link className="text-link" to={`/applications/${item._id}`}>Open application</Link></Card>) || <Empty text="Your application list will appear here." />}</section>;
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["admin-users", search, role, page], queryFn: () => adminApi.users({ search, role: role || undefined, page, limit: 20 }).then((r) => r.data.data) });
  const toggle = useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => adminApi.setUserStatus(id, active), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }) });
  return <section className="page"><PageTitle eyebrow="ADMIN CONTROL" title="Users"><p className="muted">Search accounts and manage platform access.</p></PageTitle><div className="filters"><input aria-label="Search users" placeholder="Name or email" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><select aria-label="Filter by role" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option value="">All roles</option><option>CANDIDATE</option><option>RECRUITER</option><option>ADMIN</option></select></div><RequestState loading={query.isLoading} error={query.isError}>{query.data?.users.length ? <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Access</th><th></th></tr></thead><tbody>{query.data.users.map((item) => <tr key={item._id}><td>{item.name}</td><td>{item.email}</td><td>{item.role}</td><td>{formattedDate(item.createdAt)}</td><td>{item.isActive ? "Active" : "Suspended"}</td><td><Button disabled={toggle.isPending} onClick={() => toggle.mutate({ id: item._id, active: !item.isActive })}>{item.isActive ? "Suspend" : "Restore"}</Button></td></tr>)}</tbody></table></div> : <Empty text="No accounts found." />}<PaginationBar page={page} totalPages={query.data?.pagination.totalPages || 1} onPage={setPage} />{toggle.isError && <p className="error">{errorText(toggle.error, "Account access could not be changed.")}</p>}</RequestState></section>;
}

export function AdminJobsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["admin-jobs", search, status, page], queryFn: () => adminApi.jobs({ search, status: status || undefined, page, limit: 20 }).then((r) => r.data.data) });
  const change = useMutation({ mutationFn: ({ id, value }: { id: string; value: string }) => adminApi.setJobStatus(id, value), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }) });
  return <section className="page"><PageTitle eyebrow="ADMIN CONTROL" title="Job moderation"><p className="muted">Review listings and manage their publication status.</p></PageTitle><div className="filters"><input aria-label="Search jobs" placeholder="Job title" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><select aria-label="Filter by job status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option><option>DRAFT</option><option>PUBLISHED</option><option>CLOSED</option></select></div><RequestState loading={query.isLoading} error={query.isError}>{query.data?.jobs.length ? <div className="table-wrap"><table><thead><tr><th>Role</th><th>Company</th><th>Mode</th><th>Created</th><th>Status</th></tr></thead><tbody>{query.data.jobs.map((job) => <tr key={job._id}><td>{job.title}</td><td>{job.companyId && "name" in job.companyId ? job.companyId.name : "—"}</td><td>{job.workMode}</td><td>{formattedDate((job as Job & { createdAt?: string }).createdAt)}</td><td><select aria-label={`Status for ${job.title}`} value={job.status || "DRAFT"} onChange={(event) => change.mutate({ id: job._id, value: event.target.value })}><option>DRAFT</option><option>PUBLISHED</option><option>CLOSED</option></select></td></tr>)}</tbody></table></div> : <Empty text="No jobs found." />}<PaginationBar page={page} totalPages={query.data?.pagination.totalPages || 1} onPage={setPage} />{change.isError && <p className="error">{errorText(change.error, "Job status could not be changed.")}</p>}</RequestState></section>;
}

export function AdminCompaniesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [verified, setVerified] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["admin-companies", search, verified, page], queryFn: () => adminApi.companies({ search, isVerified: verified || undefined, page, limit: 20 }).then((r) => r.data.data) });
  const toggle = useMutation({ mutationFn: ({ id, value }: { id: string; value: boolean }) => adminApi.verifyCompany(id, value), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-companies"] }) });
  return <section className="page"><PageTitle eyebrow="ADMIN CONTROL" title="Company verification"><p className="muted">Review company details and verification status.</p></PageTitle><div className="filters"><input aria-label="Search companies" placeholder="Company name" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><select aria-label="Filter verification" value={verified} onChange={(event) => { setVerified(event.target.value); setPage(1); }}><option value="">All companies</option><option value="true">Verified</option><option value="false">Pending</option></select></div><RequestState loading={query.isLoading} error={query.isError}>{query.data?.companies.length ? <div className="table-wrap"><table><thead><tr><th>Company</th><th>Industry</th><th>Owner</th><th>Created</th><th>Verification</th><th></th></tr></thead><tbody>{query.data.companies.map((company) => <tr key={company._id}><td>{company.name}</td><td>{company.industry || "—"}</td><td>{company.ownerId && typeof company.ownerId !== "string" ? company.ownerId.email : "—"}</td><td>{formattedDate((company as Company & { createdAt?: string }).createdAt)}</td><td>{company.isVerified ? "Verified" : "Pending"}</td><td><Button disabled={toggle.isPending} onClick={() => toggle.mutate({ id: company._id, value: !company.isVerified })}>{company.isVerified ? "Unverify" : "Verify"}</Button></td></tr>)}</tbody></table></div> : <Empty text="No companies found." />}<PaginationBar page={page} totalPages={query.data?.pagination.totalPages || 1} onPage={setPage} />{toggle.isError && <p className="error">{errorText(toggle.error, "Verification status could not be changed.")}</p>}</RequestState></section>;
}

export function AdminApplicationsPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["admin-applications", status, page], queryFn: () => adminApi.applications({ status: status || undefined, page, limit: 20 }).then((r) => r.data.data) });
  return <section className="page"><PageTitle eyebrow="ADMIN CONTROL" title="Application oversight"><p className="muted">Monitor application volume and outcomes across the platform.</p></PageTitle><div className="filters"><select aria-label="Filter by application status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{applicationStatuses.map((value) => <option key={value}>{value}</option>)}</select></div><RequestState loading={query.isLoading} error={query.isError}>{query.data?.applications.length ? <div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Role</th><th>Company</th><th>Applied</th><th>Status</th></tr></thead><tbody>{query.data.applications.map((application) => <tr key={application._id}><td>{application.candidateId && typeof application.candidateId !== "string" ? application.candidateId.name : "Candidate"}<small>{application.candidateId && typeof application.candidateId !== "string" ? application.candidateId.email : ""}</small></td><td>{(application.jobId as Job | undefined)?.title || "Role"}</td><td>{(application.jobId as Job | undefined)?.companyId && "name" in ((application.jobId as Job).companyId || {}) ? ((application.jobId as Job).companyId as { name: string }).name : "—"}</td><td>{formattedDate(application.appliedAt)}</td><td><Badge>{application.status.replaceAll("_", " ")}</Badge></td></tr>)}</tbody></table></div> : <Empty text="No applications found." />}<PaginationBar page={page} totalPages={query.data?.pagination.totalPages || 1} onPage={setPage} /></RequestState></section>;
}

export function NotFoundPage() {
  return <section className="page"><PageTitle eyebrow="404" title="Page not found"><p className="muted">The address may have changed, or the page may no longer be available.</p></PageTitle><Link className="button" to="/">Return home</Link></section>;
}

export function SavedJobsPage() {
  const query = useQuery({ queryKey: ["saved-jobs"], queryFn: () => savedJobsApi.list().then((response) => response.data.data.jobs) });
  return <section className="page"><PageTitle eyebrow="CANDIDATE SPACE" title="Saved jobs"><p className="muted">Keep interesting opportunities together while you decide what fits.</p></PageTitle><RequestState loading={query.isLoading} error={query.isError}>{query.data?.length ? <div className="job-grid">{query.data.map((job) => <JobCard key={job._id} job={job} />)}</div> : <Empty text="Saved opportunities will appear here." />}</RequestState><Link className="text-link" to="/jobs">Browse all jobs <span aria-hidden="true">→</span></Link></section>;
}

export function RecruiterApplicantResumePage() {
  const { id = "" } = useParams();
  const resume = useQuery({ queryKey: ["application-resume", id], queryFn: () => applicationsApi.resume(id).then((response) => response.data.data.url) });
  return <section className="page narrow"><Link className="back" to={`/recruiter/applications/${id}`}>← Application review</Link><PageTitle eyebrow="APPLICATION REVIEW" title="Submitted resume"><p className="muted">This private link is available to the recruiter responsible for this application.</p></PageTitle><RequestState loading={resume.isLoading} error={resume.isError}>{resume.data && <a className="button" href={resume.data} target="_blank" rel="noreferrer">Open resume</a>}</RequestState></section>;
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["notifications"], queryFn: () => notificationsApi.list().then((response) => response.data.data) });
  const markRead = useMutation({ mutationFn: (id: string) => notificationsApi.read(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }) });
  return <section className="page"><PageTitle eyebrow="YOUR WORKSPACE" title="Notifications"><p className="muted">Application and interview updates for your account.</p></PageTitle><RequestState loading={query.isLoading} error={query.isError}>{query.data?.notifications.length ? <div className="notification-list">{query.data.notifications.map((item) => <article className={`notification-item${item.readAt ? " is-read" : ""}`} key={item._id}><div><div className="notification-heading"><h2>{item.title}</h2>{!item.readAt && <span className="unread-indicator">New</span>}</div><p>{item.message}</p><time dateTime={item.createdAt}>{formattedDate(item.createdAt)}</time></div><div className="notification-actions"><Link className="text-link" to={item.link} onClick={() => { if (!item.readAt) markRead.mutate(item._id); }}>View update <span aria-hidden="true">→</span></Link>{!item.readAt && <button className="text-link" type="button" disabled={markRead.isPending} onClick={() => markRead.mutate(item._id)}>Mark read</button>}</div></article>)}</div> : <Empty text="You’re all caught up." />}</RequestState>{markRead.isError && <p className="error" role="alert">Could not update this notification.</p>}</section>;
}