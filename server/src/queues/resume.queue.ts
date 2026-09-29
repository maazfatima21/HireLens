import { Queue } from "bullmq";
import { redisConfigured, redisConnection } from "../config/redis.js";
import { ApiError } from "../utils/api-error.js";

export const resumeAnalysisQueue = redisConfigured && redisConnection
  ? new Queue("resume-analysis", { connection: redisConnection })
  : null;

export const enqueueResumeAnalysis = async (candidateId: string, resumeFileKey: string, processingToken: string) => {
  if (!resumeAnalysisQueue) throw new ApiError(503, "Resume processing is not configured");
  return resumeAnalysisQueue.add("process", { candidateId, resumeFileKey, processingToken }, {
    attempts: 5,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 100
  });
};
