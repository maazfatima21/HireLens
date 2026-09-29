import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { ApiError } from "../utils/api-error.js";

const matchSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  experienceMatch: z.boolean(),
  recommendations: z.array(z.string()),
  summary: z.string()
}).strict();

export type MatchResult = z.infer<typeof matchSchema>;

export const generateResumeJobMatch = async (resumeText: string, job: { title: string; description: string; skills: string[]; experienceMin?: number; experienceMax?: number }) => {
  if (!process.env.GEMINI_API_KEY) throw new ApiError(503, "AI matching is not configured");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You provide Resume-Job Match Assistance only. Do not infer protected or sensitive traits and do not predict hiring or selection. Return JSON only matching this schema: {"matchScore":0,"matchedSkills":[],"missingSkills":[],"experienceMatch":false,"recommendations":[],"summary":""}. Resume:\n${resumeText}\nJob:\n${JSON.stringify(job)}`;
  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json" } });
    const raw = response.text;
    if (!raw) throw new Error("Empty AI response");
    return matchSchema.parse(JSON.parse(raw));
  } catch {
    throw new ApiError(502, "AI matching returned an invalid response");
  }
};
