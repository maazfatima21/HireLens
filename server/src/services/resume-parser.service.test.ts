import { describe, expect, it } from "vitest";
import { extractResumeText } from "./resume-parser.service.js";

describe("resume parser", () => {
  it("rejects unsupported MIME types", async () => {
    await expect(extractResumeText(Buffer.from("resume"), "text/plain")).rejects.toThrow("Unsupported resume format");
  });
});
