import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationsApi, savedJobsApi } from "../api/api";
import { useAuth } from "../context/AuthContext";
import type { Job } from "../types";
import { Card, Badge, Button } from "./ui";

export function JobCard({ job }: { job: Job }) {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const saved = useQuery({
		queryKey: ["saved-jobs"],
		queryFn: () => savedJobsApi.list().then((response) => response.data.data.jobs),
		enabled: user?.role === "CANDIDATE",
	});
	const save = useMutation({
		mutationFn: (isSaved: boolean) =>
			isSaved ? savedJobsApi.remove(job._id) : savedJobsApi.save(job._id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-jobs"] }),
	});
	const isSaved = Boolean(saved.data?.some((item) => item._id === job._id));

	return (
		<Card className="job-card">
			<div className="job-card-top">
				<div className="eyebrow">{job.companyId?.name || "Company"}</div>
				{user?.role === "CANDIDATE" && (
					<Button
						className="button save-job-button"
						type="button"
						aria-label={
							isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`
						}
						aria-pressed={isSaved}
						disabled={save.isPending}
						onClick={() => save.mutate(isSaved)}
					>
						{isSaved ? "Saved" : "Save"}
					</Button>
				)}
			</div>
			<h3>{job.title}</h3>
			<p className="muted">
				{job.location?.city ||
					(job.workMode === "REMOTE" ? "Remote" : "Location not specified")}
				{" "}
				· {job.workMode} · {job.jobType.replaceAll("_", " ")}
			</p>
			<div className="tags">
				{job.skills?.slice(0, 5).map((skill) => (
					<Badge key={skill}>{skill}</Badge>
				))}
			</div>
			{save.isError && (
				<p className="error" role="alert">
					Could not update saved jobs.
				</p>
			)}
			<Link className="text-link" to={`/jobs/${job._id}`}>
				View opportunity <span aria-hidden="true">→</span>
			</Link>
		</Card>
	);
}
