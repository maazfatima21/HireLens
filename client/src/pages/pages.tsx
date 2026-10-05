import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationsApi, authApi, jobsApi, adminApi, notificationsApi, profileApi, resumeApi,} from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Badge, Button, Card, Empty, Loading } from "../components/ui";
import { JobCard } from "../components/JobCard";

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const applicationId = location.pathname.match(/^\/recruiter\/applications\/([^/]+)$/)?.[1];
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => notificationsApi.list().then((response) => response.data.data), enabled: Boolean(user) });
  return (
    <>
      <header>
        <Link className="brand" to="/">
          HireLens<span>/</span>
        </Link>
        <nav aria-label="Main navigation">
          <NavLink to="/jobs">Find jobs</NavLink>
          <NavLink to="/employers">For employers</NavLink>
          <NavLink to="/about">About</NavLink>
          {user?.role === "CANDIDATE" && <NavLink to="/saved-jobs">Saved jobs</NavLink>}
          {user && <NavLink to="/notifications">Notifications{notifications.data?.unreadCount ? ` (${notifications.data.unreadCount})` : ""}</NavLink>}
          {user?.role === "RECRUITER" && applicationId && <Link className="nav-button" to={`/recruiter/applications/${applicationId}/resume`}>View applicant resume</Link>}
          {user && (
            <NavLink
              to={
                user.role === "ADMIN"
                  ? "/admin"
                  : user.role === "RECRUITER"
                    ? "/recruiter/dashboard"
                    : "/dashboard"
              }
            >
              Dashboard
            </NavLink>
          )}
          {user ? (
            <button className="nav-button" onClick={logout}>
              Log out
            </button>
          ) : (
            <Link className="nav-button" to="/login">
              Sign in
            </Link>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link className="brand" to="/">HireLens<span>/</span></Link>
            <p>Thoughtful recruiting.<br />Clearer opportunities.</p>
          </div>
          <div className="footer-next">
            <p className="eyebrow">YOUR NEXT STEP</p>
            <h2>Make room for a better conversation.</h2>
            <div className="footer-actions">
              <Link to="/register">Create a candidate profile <span aria-hidden="true">↗</span></Link>
              <Link to="/login">Recruiter sign in <span aria-hidden="true">↗</span></Link>
              <Link to="/data-and-ai">How we use data &amp; AI <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} HireLens</span>
          <span>For every person behind a hiring decision.</span>
        </div>
      </footer>
    </>
  );
}
export function Home() {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  return (
    <>
      <section className="home-hero">
        <img
          className="home-hero-image"
          src="/Home.png"
          alt="Colleagues sharing ideas around a table"
        />
        <div className="home-hero-content">
          <p className="eyebrow">A BETTER WAY TO MOVE FORWARD</p>
          <h1>Work that fits. Hiring with clarity.</h1>
          <p className="lede">A thoughtful place to discover meaningful roles, tell your story, and make confident next steps.</p>
          <form
            className="home-search hero-search-box"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(`/jobs?search=${encodeURIComponent(term)}`);
            }}
          >
            <input
              aria-label="Search jobs"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Job title, skill, or company"
            />
            <Button>Find opportunities</Button>
          </form>
          <Link className="hero-secondary-link" to="/about">Get to know HireLens <span aria-hidden="true">→</span></Link>
        </div>
        <span className="hero-image-caption">Better conversations start with a clearer view.</span>
      </section>
      <section className="home-value page">
        <div className="home-value-heading">
          <p className="eyebrow">ONE CLEARER WORKSPACE</p>
          <h2>Make the next step feel more considered.</h2>
          <p className="muted">Keep the important parts of finding work and building a team in one focused place.</p>
        </div>
        <div className="home-pathways">
          <article className="pathway-card">
            <span>01 / CANDIDATES</span>
            <h3>Make your experience easier to see.</h3>
            <p>Explore roles, keep your resume ready, and follow each application from one workspace.</p>
            <Link to="/jobs">Explore opportunities <span aria-hidden="true">→</span></Link>
          </article>
          <article className="pathway-card">
            <span>02 / EMPLOYERS</span>
            <h3>Keep your hiring process moving.</h3>
            <p>Publish roles, review applications, and coordinate interviews with less friction.</p>
            <Link to="/employers">Explore hiring tools <span aria-hidden="true">→</span></Link>
          </article>
          <article className="pathway-card">
            <span>03 / THE PLATFORM</span>
            <h3>Clarity at every step.</h3>
            <p>See how candidate and recruiter workspaces support more thoughtful decisions.</p>
            <Link to="/about">Our approach <span aria-hidden="true">→</span></Link>
          </article>
        </div>
      </section>
    </>
  );
}
export function Jobs() {
  const params = new URLSearchParams(location.search);
  const [search, setSearch] = useState(params.get("search") || "");
  const [locationFilter, setLocationFilter] = useState(params.get("location") || "");
  const [workMode, setWorkMode] = useState(params.get("workMode") || "");
  const [jobType, setJobType] = useState(params.get("jobType") || "");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["jobs", search, locationFilter, workMode, jobType, page],
    queryFn: () =>
      jobsApi.search({ search, location: locationFilter || undefined, workMode: workMode || undefined, jobType: jobType || undefined, page, limit: 10 }).then((r) => r.data.data),
  });
  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">OPPORTUNITIES</p>
        <h1>Find work that fits.</h1>
        <p className="muted">Search published roles by what matters to you.</p>
      </div>
      <div className="filters job-filters">
        <input
          aria-label="Search by role, company, or skill"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Keyword"
        />
        <input
          aria-label="Filter by location"
          value={locationFilter}
          onChange={(e) => {
            setLocationFilter(e.target.value);
            setPage(1);
          }}
          placeholder="City, region, or country"
        />
        <select
          aria-label="Filter by work mode"
          value={workMode}
          onChange={(e) => {
            setWorkMode(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All work modes</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ONSITE">On-site</option>
        </select>
        <select aria-label="Filter by employment type" value={jobType} onChange={(e) => { setJobType(e.target.value); setPage(1); }}>
          <option value="">All employment types</option>
          <option value="FULL_TIME">Full-time</option>
          <option value="PART_TIME">Part-time</option>
          <option value="CONTRACT">Contract</option>
          <option value="INTERNSHIP">Internship</option>
        </select>
      </div>
      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <p className="error">Could not load jobs.</p>
      ) : (
        <>
          <div className="job-grid">
            {query.data?.jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
          {!query.data?.jobs.length && (
            <Empty text="No matching published jobs" />
          )}
          <div className="pagination">
            <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span>Page {page}</span>
            <Button
              disabled={
                !query.data?.pagination ||
                page >= query.data.pagination.totalPages
              }
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
export function JobDetail() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [coverLetter, setCoverLetter] = useState("");
  const [applicationDetails, setApplicationDetails] = useState({
    contactPhone: "",
    linkedinUrl: "",
    portfolioUrl: "",
    relevantExperienceYears: "",
    noticePeriod: "",
  });
  const query = useQuery({
    queryKey: ["job", id],
    queryFn: () => jobsApi.detail(id).then((r) => r.data.data.job),
  });
  const apply = useMutation({
    mutationFn: () =>
      applicationsApi.apply({
        jobId: id,
        coverLetter: coverLetter.trim() || undefined,
        contactPhone: applicationDetails.contactPhone.trim() || undefined,
        linkedinUrl: applicationDetails.linkedinUrl.trim() || undefined,
        portfolioUrl: applicationDetails.portfolioUrl.trim() || undefined,
        relevantExperienceYears: applicationDetails.relevantExperienceYears === "" ? undefined : Number(applicationDetails.relevantExperienceYears),
        noticePeriod: applicationDetails.noticePeriod || undefined,
      }),
  });
  if (query.isLoading)
    return (
      <section className="page">
        <Loading />
      </section>
    );
  const job = query.data;
  const company = job?.companyId && "name" in job.companyId ? job.companyId : undefined;
  const jobLocation = [job?.location?.city, job?.location?.state, job?.location?.country]
    .filter(Boolean)
    .join(", ") || (job?.workMode === "REMOTE" ? "Remote" : "Location not specified");
  return (
    <section className="page narrow">
      <Link className="back" to="/jobs">
        ← All opportunities
      </Link>
      <p className="eyebrow">{company?.name || "COMPANY"}</p>
      <h1>{job?.title}</h1>
      <p className="muted">
        {jobLocation} · {job?.workMode?.replaceAll("_", " ")} · {job?.jobType?.replaceAll("_", " ")}
      </p>
      <div className="detail-layout">
        <article>
          <h2>About the role</h2>
          <p className="body-copy">{job?.description}</p>
          <h2>Role details</h2>
          <dl className="job-detail-facts">
            <div><dt>Employment type</dt><dd>{job?.jobType?.replaceAll("_", " ")}</dd></div>
            <div><dt>Work mode</dt><dd>{job?.workMode?.replaceAll("_", " ")}</dd></div>
            <div><dt>Location</dt><dd>{jobLocation}</dd></div>
            <div><dt>Experience</dt><dd>{job?.experienceMin !== undefined && job.experienceMax !== undefined ? `${job.experienceMin}–${job.experienceMax} years` : job?.experienceMin !== undefined ? `${job.experienceMin}+ years` : job?.experienceMax !== undefined ? `Up to ${job.experienceMax} years` : "Not specified"}</dd></div>
            <div><dt>Salary</dt><dd>{job?.salaryMin !== undefined && job.salaryMax !== undefined ? `${job.salaryCurrency || ""} ${job.salaryMin.toLocaleString()} – ${job.salaryCurrency || ""} ${job.salaryMax.toLocaleString()}` : job?.salaryMin !== undefined ? `From ${job.salaryCurrency || ""} ${job.salaryMin.toLocaleString()}` : job?.salaryMax !== undefined ? `Up to ${job.salaryCurrency || ""} ${job.salaryMax.toLocaleString()}` : "Not disclosed"}</dd></div>
            <div><dt>Application deadline</dt><dd>{job?.applicationDeadline ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(job.applicationDeadline)) : "Not specified"}</dd></div>
          </dl>
          <h2>Must Have Skills</h2>
          <div className="tags">
            {job?.skills.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
          {company && (
            <section className="company-job-profile">
              <h2>About {company.name}</h2>
              {company.tagline && <p className="muted">{company.tagline}</p>}
              {company.description && <p className="body-copy">{company.description}</p>}
              <dl className="job-detail-facts">
                {company.industry && <div><dt>Industry</dt><dd>{company.industry}</dd></div>}
                {company.website && <div><dt>Website</dt><dd><a href={company.website} target="_blank" rel="noreferrer">Visit company website</a></dd></div>}
              </dl>
            </section>
          )}
        </article>
        <Card>
          <h3>Ready to apply?</h3>
          {user?.role === "CANDIDATE" ? (
            <form
              className="workspace-form application-form"
              onSubmit={(event) => {
                event.preventDefault();
                apply.mutate();
              }}
            >
              <div className="application-form-section">
                <h4>Contact and professional links</h4>
                <div className="application-form-grid">
                  <label className="application-field">
                    <span className="application-field-title">Phone number <span className="required-indicator" aria-hidden="true">*</span></span>
                    <input
                      type="tel"
                      maxLength={40}
                      required
                      value={applicationDetails.contactPhone}
                      onChange={(event) =>
                        setApplicationDetails({
                          ...applicationDetails,
                          contactPhone: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="application-field">
                    <span className="application-field-title">LinkedIn profile <span className="required-indicator" aria-hidden="true">*</span></span>
                    <input
                      type="url"
                      maxLength={500}
                      required
                      placeholder="https://www.linkedin.com/in/you"
                      value={applicationDetails.linkedinUrl}
                      onChange={(event) =>
                        setApplicationDetails({
                          ...applicationDetails,
                          linkedinUrl: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="application-field">
                    <span className="application-field-title">Portfolio or website <span className="required-indicator" aria-hidden="true">*</span></span>
                    <input
                      type="url"
                      maxLength={500}
                      required
                      placeholder="https://example.com"
                      value={applicationDetails.portfolioUrl}
                      onChange={(event) =>
                        setApplicationDetails({
                          ...applicationDetails,
                          portfolioUrl: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="application-form-section">
                <h4>Experience and availability</h4>
                <div className="application-form-grid">
                  <label className="application-field">
                    <span className="application-field-title">Relevant experience in years <span className="required-indicator" aria-hidden="true">*</span></span>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      step="1"
                      required
                      value={applicationDetails.relevantExperienceYears}
                      onChange={(event) =>
                        setApplicationDetails({
                          ...applicationDetails,
                          relevantExperienceYears: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="application-field">
                    <span className="application-field-title">Notice period <span className="required-indicator" aria-hidden="true">*</span></span>
                    <select
                      required
                      value={applicationDetails.noticePeriod}
                      onChange={(event) =>
                        setApplicationDetails({
                          ...applicationDetails,
                          noticePeriod: event.target.value,
                        })
                      }
                    >
                      <option value="">Select</option>
                      <option value="IMMEDIATE">Available immediately</option>
                      <option value="TWO_WEEKS">2 weeks</option>
                      <option value="ONE_MONTH">1 month</option>
                      <option value="TWO_MONTHS">2 months</option>
                      <option value="THREE_MONTHS">3 months</option>
                      <option value="OTHER">Other / flexible</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="application-form-section">
                <label className="application-field cover-letter-field" htmlFor="application-cover-letter">
                  <span className="application-field-title">Cover letter <span className="required-indicator" aria-hidden="true">*</span></span>
                  <textarea
                    id="application-cover-letter"
                    maxLength={5000}
                    rows={5}
                    required
                    value={coverLetter}
                    onChange={(event) => setCoverLetter(event.target.value)}
                    placeholder="Tell the hiring team why this role interests you."
                  />
                </label>
              </div>
              <label className="application-confirmation">
                <input type="checkbox" required />
                <span>I confirm that all the information provided is accurate.</span>
                <span className="required-indicator" aria-hidden="true">*</span>
              </label>
              <Button type="submit" disabled={apply.isPending || apply.isSuccess}>
                {apply.isPending ? "Submitting..." : apply.isSuccess ? "Application sent" : "Submit application"}
              </Button>
            </form>
          ) : (
            <p className="muted">Sign in as a candidate to apply.</p>
          )}
          {apply.isError && <p className="error" role="alert">{(apply.error as { response?: { data?: { message?: string } } }).response?.data?.message || "This application could not be submitted."}</p>}
          {apply.isSuccess && <p className="success" role="status">Your application was submitted.</p>}
        </Card>
      </div>
    </section>
  );
}
export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="auth-page">
      <Card>
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Sign in</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const user = await login(email, password);
              nav(
                user.role === "ADMIN"
                  ? "/admin"
                  : user.role === "RECRUITER"
                    ? "/recruiter/dashboard"
                    : "/dashboard",
              );
            } catch {
              setError("Invalid email or password");
            }
          }}
        >
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="error">{error}</p>}
          <Button>Sign in</Button>
        </form>
        <p className="muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </Card>
    </section>
  );
}
export function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const mutation = useMutation({
    mutationFn: () => authApi.register(form),
    onSuccess: () => nav("/login"),
  });
  return (
    <section className="auth-page">
      <Card>
        <p className="eyebrow">JOIN HIRELENS</p>
        <h1>Create your account</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            required
            minLength={8}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button>Create candidate account</Button>
        </form>
      </Card>
    </section>
  );
}
export function CandidateDashboard() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["applications"],
    queryFn: () => applicationsApi.mine().then((r) => r.data.data.applications),
  });
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.get().then((r) => r.data.data.profile),
  });
  const resume = profile.data?.resume;
  return (
    <section className="page">
      <p className="eyebrow">CANDIDATE SPACE</p>
      <h1>Good to see you, {user?.name}.</h1>
      <div className="stat-grid">
        <Card>
          <span>Applications</span>
          <strong>{q.data?.length ?? 0}</strong>
        </Card>
        <Card>
          <span>Profile</span>
          <strong>Ready to shape</strong>
        </Card>
        <Card>
          <span>Resume</span>
          <strong>{resume ? "Uploaded" : "Not uploaded"}</strong>
          <Link className="text-link" to="/resume">
            {resume ? "Manage resume" : "Upload resume"}
          </Link>
        </Card>
      </div>
      <h2>Recent applications</h2>
      {q.isLoading ? (
        <Loading />
      ) : q.data?.length ? (
        q.data.slice(0, 5).map((a) => (
          <Card key={a._id}>
            <div className="row">
              <div>
                <h3>{a.jobId?.title}</h3>
                <p className="muted">{a.jobId?.companyId?.name}</p>
              </div>
              <Badge>{a.status}</Badge>
            </div>
          </Card>
        ))
      ) : (
        <Empty text="Your application story starts here." />
      )}
    </section>
  );
}
export function RecruiterDashboard() {
  return (
    <section className="page">
      <p className="eyebrow">RECRUITER SPACE</p>
      <h1>Build a better hiring pipeline.</h1>
      <div className="stat-grid">
        <Card>
          <span>Jobs</span>
          <strong>Manage roles</strong>
        </Card>
        <Card>
          <span>Applicants</span>
          <strong>Review talent</strong>
        </Card>
        <Card>
          <span>Interviews</span>
          <strong>Stay coordinated</strong>
        </Card>
      </div>
      <Link className="button" to="/recruiter/jobs">
        Open job management
      </Link>
    </section>
  );
}
export function AdminDashboard() {
  const q = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.stats().then((r) => r.data.data),
  });
  return (
    <section className="page">
      <p className="eyebrow">ADMIN CONTROL</p>
      <h1>Platform overview.</h1>
      {q.isLoading ? (
        <Loading />
      ) : (
        <div className="stat-grid">
          {[
            "totalUsers",
            "candidates",
            "recruiters",
            "totalJobs",
            "publishedJobs",
            "totalApplications",
            "totalCompanies",
            "verifiedCompanies",
          ].map((key) => (
            <Card key={key}>
              <span>{key.replace(/[A-Z]/g, (m) => ` ${m}`).toUpperCase()}</span>
              <strong>{typeof q.data?.[key] === "number" ? q.data[key] : 0}</strong>
            </Card>
          ))}
        </div>
      )}
      <div className="admin-links">
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/jobs">Jobs</Link>
        <Link to="/admin/companies">Companies</Link>
        <Link to="/admin/applications">Applications</Link>
      </div>
    </section>
  );
}
export function ResumePage() {
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.get().then((r) => r.data.data.profile).catch((requestError) => {
      if ((requestError as { response?: { status?: number } }).response?.status === 404) return { resume: undefined, skills: [] as string[], experience: [], education: [] };
      throw requestError;
    }),
  });
  const analysis = useQuery({
    queryKey: ["resume-analysis"],
    queryFn: () => resumeApi.analysis().then((r) => r.data.data.analysis),
    enabled: Boolean(profile.data?.resume),
    refetchInterval: ({ state }) => state.data?.analysisStatus === "PENDING" || state.data?.analysisStatus === "PROCESSING" ? 2500 : false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const upload = useMutation({
    mutationFn: (file: File) => resumeApi.upload(file, setProgress),
    onSuccess: (result) => {
      setMessage(
        `Resume uploaded and ${result.data.data.status.toLowerCase()}.`,
      );
      setSelectedFile(null);
      const fileInput = document.getElementById("resume-file") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      setProgress(100);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["resume-analysis"] });
    },
    onError: (requestError: any) => {
      setError(requestError.response?.data?.message || "Resume upload failed.");
    },
    onSettled: () => setProgress(0),
  });
  const remove = useMutation({
    mutationFn: () => resumeApi.remove(),
    onSuccess: () => {
      setMessage("Resume removed.");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["resume-analysis"] });
    },
    onError: () => setError("Resume removal failed."),
  });
  const retryAnalysis = useMutation({
    mutationFn: () => resumeApi.retryAnalysis(),
    onSuccess: () => {
      setMessage("Resume analysis queued for retry.");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["resume-analysis"] });
    },
    onError: () => setError("Could not retry resume analysis. Please try again."),
  });
  const chooseFile = (file: File | undefined) => {
    setMessage("");
    setError("");
    if (!file) return;
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type) || !/\.(pdf|docx)$/i.test(file.name)) {
      setSelectedFile(null);
      setError("Choose a PDF or DOCX file with a matching extension.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSelectedFile(null);
      setError("Resume must be 5 MB or smaller.");
      return;
    }
    setSelectedFile(file);
  };
  const resume = profile.data?.resume;
  const openResume = async () => {
    try {
      const result = await resumeApi.download();
      window.open(result.data.data.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Could not open your resume.");
    }
  };
  return (
    <section className="page narrow">
      <p className="eyebrow">CANDIDATE SPACE</p>
      <h1>Resume workspace</h1>
      <p className="muted">
        Keep one current resume ready for applications and analysis.
      </p>
      <Card>
        <h2>{resume ? "Current resume" : "Upload your resume"}</h2>
        {resume ? (
          <>
            <p>
              <strong>{resume.fileName}</strong>
            </p>
            <p className="muted">
              Status: {analysis.isLoading ? "Checking processing status" : analysis.data?.analysisStatus || "Uploaded"}
            </p>
            <div className="row">
              <Button type="button" onClick={openResume}>
                View resume
              </Button>
              <Button
                type="button"
                onClick={() => document.getElementById("resume-file")?.click()}
              >
                Replace resume
              </Button>
              <button
                className="text-link"
                type="button"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <p className="muted">PDF or DOCX, up to 5 MB.</p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedFile) upload.mutate(selectedFile);
          }}
        >
          <input
            id="resume-file"
            type="file"
            accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
          {selectedFile && (
            <p className="muted">Selected: {selectedFile.name}</p>
          )}
          {upload.isPending && (
            <p className="muted">
              Uploading{progress ? ` ${progress}%` : "..."}
            </p>
          )}
          {upload.isPending && <progress value={progress} max="100" />}
          <Button type="submit" disabled={!selectedFile || upload.isPending}>
            {resume ? "Upload replacement" : "Upload resume"}
          </Button>
        </form>
        {analysis.data?.analysisStatus === "FAILED" && (
          <div>
            <p className="error" role="alert">{analysis.data.errorMessage || "Resume analysis could not be completed."} Your resume is saved; you can retry the analysis.</p>
            <Button type="button" disabled={retryAnalysis.isPending} onClick={() => retryAnalysis.mutate()}>
              {retryAnalysis.isPending ? "Retrying..." : "Retry analysis"}
            </Button>
          </div>
        )}
        {analysis.data?.analysisStatus === "COMPLETED" && (
          <div className="resume-analysis">
            <h2>Resume analysis</h2>
            {analysis.data.professionalSummary && <p>{analysis.data.professionalSummary}</p>}
            {analysis.data.experienceSummary && <p>{analysis.data.experienceSummary}</p>}
            {analysis.data.skills.length > 0 && <><h3>Extracted skills</h3><div className="tags">{analysis.data.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div></>}
            <div className="form-grid">
              {analysis.data.strengths.length > 0 && <div><h3>Strengths</h3><ul>{analysis.data.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div>}
              {analysis.data.areasForImprovement.length > 0 && <div><h3>Areas to improve</h3><ul>{analysis.data.areasForImprovement.map((item) => <li key={item}>{item}</li>)}</ul></div>}
            </div>
            {analysis.data.suggestedRoles.length > 0 && <><h3>Suggested roles</h3><div className="tags">{analysis.data.suggestedRoles.map((role) => <Badge key={role}>{role}</Badge>)}</div></>}
          </div>
        )}
        {analysis.isError && <p className="error">Resume processing status could not be loaded.</p>}
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </Card>
    </section>
  );
}
export function GenericPage({ title }: { title: string }) {
  return (
    <section className="page">
      <p className="eyebrow">HIRELENS</p>
      <h1>{title}</h1>
      <Card>
        <p className="muted">
          This workspace is connected to the HireLens backend and ready for the
          next workflow.
        </p>
      </Card>
    </section>
  );
}
