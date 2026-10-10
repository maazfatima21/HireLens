import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getGeminiApiKey } from "../config/gemini.js";

const resumeAnalysisSchema = z.object({
  skills: z.array(z.string()),
  experienceSummary: z.string(),
  education: z.array(z.string()),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  suggestedRoles: z.array(z.string()),
  professionalSummary: z.string().optional()
}).strict();

export type ResumeAnalysisResult = z.infer<typeof resumeAnalysisSchema>;
export type GeminiClient = Pick<GoogleGenAI, "models">;

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const DEFAULT_MAX_GEMINI_ATTEMPTS = 3;

const getErrorStatus = (error: unknown): number | undefined => {
  const details = error as { status?: unknown; response?: { status?: unknown; headers?: Record<string, string | string[] | undefined> }; headers?: Record<string, string | string[] | undefined> } | undefined;
  if (!details) return undefined;
  const status = Number(details.status ?? details.response?.status ?? 0);
  return Number.isFinite(status) && status > 0 ? status : undefined;
};

const getRetryAfterMs = (error: unknown): number | undefined => {
  const details = error as { response?: { headers?: Record<string, string | string[] | undefined> }; headers?: Record<string, string | string[] | undefined> } | undefined;
  const headers = details?.response?.headers ?? details?.headers ?? {};
  const retryAfter = headers["retry-after"] ?? headers["Retry-After"];
  if (Array.isArray(retryAfter)) return Number(retryAfter[0]) * 1000 || undefined;
  if (typeof retryAfter === "string") {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return seconds * 1000;
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }
  return undefined;
};

const isTransientGeminiError = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  if (status && RETRYABLE_STATUS_CODES.has(status)) return true;

  const text = String(
    (error as { code?: unknown; message?: unknown; statusText?: unknown } | undefined)?.code ??
    (error as { message?: unknown } | undefined)?.message ??
    (error as { statusText?: unknown } | undefined)?.statusText ??
    ""
  ).toUpperCase();

  return text.includes("RATE_LIMIT") || text.includes("RESOURCE_EXHAUSTED") || text.includes("UNAVAILABLE") || text.includes("TIMEOUT") || text.includes("INTERNAL");
};

const getRetryDelayMs = (attempt: number, error: unknown): number => {
  const retryAfterMs = getRetryAfterMs(error);
  if (retryAfterMs !== undefined) return Math.min(retryAfterMs, 30_000);

  const baseMs = 1000 * Math.pow(2, attempt);
  const jitterMs = Math.floor(Math.random() * 500);
  return Math.min(baseMs + jitterMs, 15_000);
};

const redactSensitiveValues = (message: string) => message
  .replace(new RegExp(process.env.GEMINI_API_KEY?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") || "^$", "g"), "[REDACTED]")
  .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;]+/gi, "$1[REDACTED]")
  .replace(/(GEMINI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|MONGODB_URI|JWT_SECRET)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]");

export const getSafeGeminiErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") return "Gemini request failed";
  const details = error as { status?: unknown; statusText?: unknown; code?: unknown; message?: unknown };
  const fields = [
    typeof details.status === "number" || typeof details.status === "string" ? `status=${details.status}` : "",
    typeof details.statusText === "string" ? `statusText=${details.statusText}` : "",
    typeof details.code === "string" || typeof details.code === "number" ? `code=${details.code}` : "",
    typeof details.message === "string" ? details.message : ""
  ].filter(Boolean);
  return redactSensitiveValues(fields.length ? fields.join("; ") : "Gemini request failed");
};

export const parseResumeAnalysis = (raw: string): ResumeAnalysisResult => {
  try {
    return resumeAnalysisSchema.parse(JSON.parse(raw));
  } catch {
    throw new Error("Gemini returned invalid resume analysis");
  }
};

export const generateResumeAnalysis = async (resumeText: string, client?: GeminiClient, maxAttempts = DEFAULT_MAX_GEMINI_ATTEMPTS) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini analysis is not configured");

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await (client ?? new GoogleGenAI({ apiKey })).models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Analyze this resume for resume analysis and matching assistance only. Do not predict hiring outcomes, infer protected traits, or invent facts. Use only information present in the resume. Return JSON with exactly these fields: skills (string[]), experienceSummary (string), education (string[]), strengths (string[]), areasForImprovement (string[]), suggestedRoles (string[]), and optional professionalSummary (string). Resume:\n${resumeText}`,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: {
              skills: { type: "array", items: { type: "string" } },
              experienceSummary: { type: "string" },
              education: { type: "array", items: { type: "string" } },
              strengths: { type: "array", items: { type: "string" } },
              areasForImprovement: { type: "array", items: { type: "string" } },
              suggestedRoles: { type: "array", items: { type: "string" } },
              professionalSummary: { type: "string" }
            },
            required: ["skills", "experienceSummary", "education", "strengths", "areasForImprovement", "suggestedRoles"]
          }
        }
      });
      if (!response.text) throw new Error("Gemini returned an empty response");
      return parseResumeAnalysis(response.text);
    } catch (error) {
      lastError = error;
      const shouldRetry = isTransientGeminiError(error) && attempt < maxAttempts - 1;
      if (!shouldRetry) throw error;
      const retryDelayMs = getRetryDelayMs(attempt, error);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini request failed");
};