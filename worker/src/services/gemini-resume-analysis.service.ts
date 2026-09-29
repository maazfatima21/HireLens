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

export const generateResumeAnalysis = async (resumeText: string, client?: GeminiClient) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini analysis is not configured");

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
    throw error;
  }
};