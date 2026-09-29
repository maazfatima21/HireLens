import { describe, expect, it, vi } from "vitest";
import { generateResumeAnalysis, getSafeGeminiErrorMessage, parseResumeAnalysis, type GeminiClient } from "./gemini-resume-analysis.service.js";

const validAnalysis = {
  skills: ["TypeScript"],
  experienceSummary: "Three years of backend development.",
  education: ["BSc Computer Science"],
  strengths: ["API design"],
  areasForImprovement: ["Cloud certifications"],
  suggestedRoles: ["Backend Engineer"],
  professionalSummary: "Backend engineer focused on reliable APIs."
};

describe("resume Gemini analysis", () => {
  it("parses a valid structured response", () => {
    expect(parseResumeAnalysis(JSON.stringify(validAnalysis))).toEqual(validAnalysis);
  });

  it("rejects invalid Gemini response data", () => {
    expect(() => parseResumeAnalysis(JSON.stringify({ skills: ["TypeScript"] }))).toThrow("Gemini returned invalid resume analysis");
  });

  it("fails clearly when the API key is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const client = { models: { generateContent: vi.fn() } } as unknown as GeminiClient;
    await expect(generateResumeAnalysis("resume", client)).rejects.toThrow("Gemini analysis is not configured");
    expect(client.models.generateContent).not.toHaveBeenCalled();
  });

  it("redacts secrets from diagnostic messages", () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    expect(getSafeGeminiErrorMessage({ status: 429, statusText: "Too Many Requests", code: "RATE_LIMIT", message: "test-key authorization: Bearer secret" }))
      .toBe("status=429; statusText=Too Many Requests; code=RATE_LIMIT; [REDACTED] authorization: Bearer [REDACTED]");
  });

  it("rethrows the original Gemini error", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const original = Object.assign(new Error("quota exceeded"), { status: 429, code: "RATE_LIMIT" });
    const client = { models: { generateContent: vi.fn().mockRejectedValue(original) } } as unknown as GeminiClient;
    await expect(generateResumeAnalysis("resume", client)).rejects.toBe(original);
  });
});