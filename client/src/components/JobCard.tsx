import { Link } from "react-router-dom";
import type { Job } from "../types";
import { Card, Badge, Button } from "./ui";

function formattedJobType(value: string) {
	return value
		.toLowerCase()
		.split("_")
		.map((part) => part[0].toUpperCase() + part.slice(1))
		.join(" ");
}

function salaryRange(job: Job) {
	if (job.salaryMin === undefined && job.salaryMax === undefined) {
		return "Not disclosed";
	}

	const formatAmount = (amount: number) =>
		`${job.salaryCurrency || ""} ${amount.toLocaleString()}`.trim();

	if (job.salaryMin !== undefined && job.salaryMax !== undefined) {
		return `${formatAmount(job.salaryMin)} – ${formatAmount(job.salaryMax)}`;
	}
	if (job.salaryMin !== undefined) return `From ${formatAmount(job.salaryMin)}`;
	return `Up to ${formatAmount(job.salaryMax!)}`;
}

function experienceRange(job: Job) {
	if (job.experienceMin !== undefined && job.experienceMax !== undefined) {
		return `${job.experienceMin}–${job.experienceMax} years`;
	}
	if (job.experienceMin !== undefined) return `${job.experienceMin}+ years`;
	if (job.experienceMax !== undefined) return `Up to ${job.experienceMax} years`;
	return "Not specified";
}

function formattedDeadline(value?: string) {
	if (!value) return "Not specified";
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? "Not specified"
		: new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function JobCard({ job }: { job: Job }) {
	const company = job.companyId && "name" in job.companyId ? job.companyId : undefined;
	const location = [job.location?.city, job.location?.state, job.location?.country]
		.filter(Boolean)
		.join(", ") || (job.workMode === "REMOTE" ? "Remote" : "Location not specified");

	return (
		<Card className="job-card">
			<div className="job-card-top">
				<div>
					<div className="eyebrow">{company?.name || "Company"}</div>
					{company?.industry && (
						<p className="job-card-company-meta">{company.industry}</p>
					)}
				</div>
			</div>
			<h3>{job.title}</h3>
			<p className="job-card-location">{location}</p>
			<p className="job-card-meta-row">
				<span>{formattedJobType(job.jobType)}</span>
				<span>•</span>
				<span>{formattedJobType(job.workMode)}</span>
			</p>
			<Link to={`/jobs/${job._id}`}>
				<Button className="button" type="button">Apply</Button>
			</Link>
		</Card>
	);
}
