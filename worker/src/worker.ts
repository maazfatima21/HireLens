import "dotenv/config";
import mongoose from "mongoose";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { processResumeAnalysis } from "./jobs/resume-analysis.job.js";
import { ResumeAnalysis } from "./models/resume-analysis.model.js";
import { getSafeGeminiErrorMessage } from "./services/gemini-resume-analysis.service.js";

const required = ["MONGODB_URI", "REDIS_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_RESUME_BUCKET", "GEMINI_API_KEY"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Worker configuration missing: ${missing.join(", ")}`);

await mongoose.connect(process.env.MONGODB_URI!);
const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
const worker = new Worker("resume-analysis", async (job) => processResumeAnalysis(job.data, {
	attemptsMade: job.attemptsMade,
	maxAttempts: job.opts.attempts ?? 1
}), { connection, concurrency: 2 });
worker.on("completed", (job) => console.log(`Resume job ${job.id} completed`));
worker.on("failed", async (job, error) => {
	const safeMessage = getSafeGeminiErrorMessage(error);
	console.error(`[resume-analysis] Resume job ${job?.id} failed: ${safeMessage}`);
	if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;
	await ResumeAnalysis.findOneAndUpdate(
		{ candidateId: job.data.candidateId, resumeFileKey: job.data.resumeFileKey, processingToken: job.data.processingToken, analysisStatus: { $in: ["PENDING", "PROCESSING"] } },
		{ $set: { analysisStatus: "FAILED", errorMessage: safeMessage } }
	).catch((statusError) => console.error("Could not persist final resume failure status", getSafeGeminiErrorMessage(statusError)));
});

const shutdown = async () => { await worker.close(); await connection.quit(); await mongoose.disconnect(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
console.log("HireLens worker running");
