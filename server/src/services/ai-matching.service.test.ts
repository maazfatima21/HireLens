import { describe, expect, it, vi } from "vitest";
import { generateResumeJobMatch } from "./ai-matching.service.js";

describe("AI matching configuration", () => {
  it("fails clearly when Gemini is not configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await expect(generateResumeJobMatch("resume", { title: "role", description: "description", skills: [] })).rejects.toThrow("AI matching is not configured");
  });
});
