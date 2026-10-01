import { Link, NavLink } from "react-router-dom";
import { Button } from "../components/ui";

function EmployerSectionSwitch() {
  return (
    <nav className="employer-section-switch" aria-label="Employer information">
      <NavLink to="/employers" end>Employers</NavLink>
      <NavLink to="/data-and-ai">Data &amp; AI</NavLink>
    </nav>
  );
}

export function AboutPage() {
  return (
    <section className="public-page">
      <div className="public-intro">
        <p className="eyebrow">ABOUT HIRELENS</p>
        <h1>Good work begins with being understood.</h1>
        <p className="public-lede">HireLens brings job discovery and hiring coordination into one considered experience, so people can spend less time navigating the process and more time on the work ahead.</p>
      </div>
      <figure className="public-image-figure">
        <img src="/about.png" alt="Colleagues sharing ideas around a table" />
        <figcaption>Good work starts with a clear conversation.</figcaption>
      </figure>
      <div className="public-story-grid">
        <div>
          <p className="eyebrow">OUR POINT OF VIEW</p>
          <h2>Recruiting should feel clear on both sides.</h2>
        </div>
        <div className="public-copy">
          <p>A job search is more than a list of openings. It is a set of decisions about where your skills can grow and what kind of work matters to you.</p>
          <p>Hiring teams need the same clarity: a reliable way to share opportunities, review applications, and keep conversations moving.</p>
          <p>HireLens gives candidates and recruiters focused workspaces for those steps, with useful context kept close to the decisions it supports.</p>
        </div>
      </div>
      <div className="principles-row">
        <article><span>01</span><h3>Useful context</h3><p>Keep roles, resumes, and application progress connected.</p></article>
        <article><span>02</span><h3>Thoughtful tools</h3><p>Use analysis to support a person’s judgment, not replace it.</p></article>
        <article><span>03</span><h3>Clear next steps</h3><p>Make it easier to know what is happening and what comes next.</p></article>
      </div>
      <div className="public-cta">
        <div><p className="eyebrow">START WHERE YOU ARE</p><h2>Find your next step with HireLens.</h2></div>
        <Link className="button" to="/jobs">Explore opportunities</Link>
      </div>
    </section>
  );
}

export function EmployersPage() {
  return (
    <section className="public-page">
      <EmployerSectionSwitch />
      <div className="public-intro">
        <p className="eyebrow">FOR EMPLOYERS</p>
        <h1>A more considered way to move candidates forward.</h1>
        <p className="public-lede">Bring job publishing, application review, and interview coordination together in a focused recruiter workspace.</p>
        <div className="public-actions">
          <Link className="button" to="/login">Recruiter sign in</Link>
          <Link className="button button-secondary" to="/about">Our approach</Link>
        </div>
      </div>
      <figure className="public-image-figure">
        <img src="/interview.jpg" alt="A team working together during a hiring conversation" />
        <figcaption>Keep the process organized. Make room for people.</figcaption>
      </figure>
      <div className="employer-feature-grid">
        <article><span>01 / SHARE</span><h2>Publish roles clearly</h2><p>Keep role details and requirements organized, then make published opportunities discoverable to candidates.</p></article>
        <article><span>02 / REVIEW</span><h2>Keep applications in view</h2><p>Review applicants, update application stages, and keep relevant context close to each decision.</p></article>
        <article><span>03 / CONNECT</span><h2>Coordinate interviews</h2><p>Manage interview details alongside the hiring process so candidates and teams can stay aligned.</p></article>
      </div>
      <div className="employer-note">
        <div><p className="eyebrow">HIRING WORKSPACE</p><h2>Less process overhead. More room for good conversations.</h2></div>
        <p>Sign in with your recruiter account to manage your company profile, open roles, applications, and interviews.</p>
        <Link className="text-link" to="/login">Go to recruiter sign in <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}

export function DataAndAIPage() {
  return (
    <section className="public-page">
      <EmployerSectionSwitch />
      <div className="public-intro">
        <p className="eyebrow">DATA &amp; AI</p>
        <h1>Your information should support your next step, not make decisions for you.</h1>
        <p className="public-lede">Here is a plain-language overview of how HireLens handles resumes and AI-assisted analysis in the current product.</p>
      </div>
      <figure className="public-image-figure">
        <img src="/data.png" alt="A person reviewing documents and notes at a workspace" />
        <figcaption>Private resume data, useful context, human judgment.</figcaption>
      </figure>
      <div className="public-story-grid">
        <div><p className="eyebrow">RESUME STORAGE</p><h2>Your resume stays in private storage.</h2></div>
        <div className="public-copy"><p>Resume files are stored in a private Supabase Storage bucket. Candidate profile and application records are stored by the HireLens API in MongoDB.</p><p>When you apply, HireLens records which resume was current at submission so the recruiter responsible for that job can request a short-lived viewing link. Replacing your profile resume does not change the file associated with an earlier application.</p><p>You can remove your current profile resume from the Resume workspace. This removes that file from storage and may make it unavailable to earlier applications; it does not delete your HireLens account or application history.</p></div>
      </div>
      <div className="principles-row">
        <article><span>01</span><h3>AI uses resume text</h3><p>When analysis or a resume–job comparison is requested, extracted resume text is sent to the configured Gemini service to produce structured assistance.</p></article>
        <article><span>02</span><h3>Results need human judgment</h3><p>Analysis and match results are informational. They are not a hiring decision, guarantee, or substitute for a candidate’s or recruiter’s judgment.</p></article>
        <article><span>03</span><h3>Access is scoped</h3><p>Recruiter resume links are issued only after checking that the recruiter owns the job attached to the application, and expire after five minutes.</p></article>
      </div>
    </section>
  );
}