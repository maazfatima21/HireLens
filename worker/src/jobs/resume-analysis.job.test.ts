import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findOneAndUpdate: vi.fn(),
  download: vi.fn(),
  extractRawText: vi.fn(),
  generateResumeAnalysis: vi.fn()
}));

vi.mock("../models/resume-analysis.model.js", () => ({
  ResumeAnalysis: {
    findOneAndUpdate: mocks.findOneAndUpdate
  }
}));
vi.mock("../config/supabase.js", () => ({
  supabaseResumeBucket: "resumes",
  supabase: { storage: { from: () => ({ download: mocks.download }) } }
}));
vi.mock("mammoth", () => ({ default: { extractRawText: mocks.extractRawText } }));
vi.mock("../services/gemini-resume-analysis.service.js", () => ({
  generateResumeAnalysis: mocks.generateResumeAnalysis,
  getSafeGeminiErrorMessage: (error: Error) => error.message
}));

import { processResumeAnalysis } from "./resume-analysis.job.js";

const validAnalysis = {
  skills: ["TypeScript"],
  experienceSummary: "Three years of backend development.",
  education: ["BSc Computer Science"],
  strengths: ["API design"],
  areasForImprovement: ["Cloud certifications"],
  suggestedRoles: ["Backend Engineer"],
  professionalSummary: "Backend engineer focused on reliable APIs."
};

const processingToken = "processing-token";
const runJob = () => processResumeAnalysis({ candidateId: "candidate-id", resumeFileKey: "resumes/candidate-id/resume.docx", processingToken });

describe("resume analysis job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findOneAndUpdate.mockResolvedValue({ _id: "analysis-id" });
    mocks.download.mockResolvedValue({ data: { arrayBuffer: async () => Buffer.from("resume") }, error: null });
    mocks.extractRawText.mockResolvedValue({ value: "Experienced software engineer with TypeScript, Node.js, API design, testing, and cloud deployment experience." });
    mocks.generateResumeAnalysis.mockResolvedValue(validAnalysis);
  });

  it("marks an exhausted Gemini retry as FAILED and rethrows the original error", async () => {
    const original = Object.assign(new Error("status=503; model unavailable"), { status: 503 });
    mocks.generateResumeAnalysis.mockRejectedValue(original);

    await expect(processResumeAnalysis(
      { candidateId: "candidate-id", resumeFileKey: "resumes/candidate-id/resume.docx", processingToken },
      { attemptsMade: 4, maxAttempts: 5 }
    )).rejects.toBe(original);

    expect(mocks.findOneAndUpdate).toHaveBeenLastCalledWith({
      _id: "analysis-id",
      candidateId: "candidate-id",
      resumeFileKey: "resumes/candidate-id/resume.docx",
      processingToken,
      analysisStatus: "PROCESSING"
    }, {
      $set: { analysisStatus: "FAILED", errorMessage: original.message }
    });
    expect(mocks.findOneAndUpdate).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ $set: expect.objectContaining({ analysisStatus: "COMPLETED" }) }));
  });

  it("keeps a failed attempt pending while BullMQ retries remain", async () => {
    const original = Object.assign(new Error("status=503; model unavailable"), { status: 503 });
    mocks.generateResumeAnalysis.mockRejectedValue(original);

    await expect(processResumeAnalysis(
      { candidateId: "candidate-id", resumeFileKey: "resumes/candidate-id/resume.docx", processingToken },
      { attemptsMade: 0, maxAttempts: 5 }
    )).rejects.toBe(original);

    expect(mocks.findOneAndUpdate).toHaveBeenLastCalledWith({
      _id: "analysis-id",
      candidateId: "candidate-id",
      resumeFileKey: "resumes/candidate-id/resume.docx",
      processingToken,
      analysisStatus: "PROCESSING"
    }, {
      $set: { analysisStatus: "PENDING" },
      $unset: { errorMessage: 1 }
    });
  });

  it("marks insufficient extracted text as FAILED without calling Gemini", async () => {
    mocks.extractRawText.mockResolvedValue({ value: "-- 1 of 1 --" });

    await expect(runJob()).rejects.toThrow("Resume text extraction returned insufficient text");

    expect(mocks.generateResumeAnalysis).not.toHaveBeenCalled();
    expect(mocks.findOneAndUpdate).toHaveBeenLastCalledWith({
      _id: "analysis-id",
      candidateId: "candidate-id",
      resumeFileKey: "resumes/candidate-id/resume.docx",
      processingToken,
      analysisStatus: "PROCESSING"
    }, {
      $set: { analysisStatus: "FAILED", errorMessage: "Resume text extraction returned insufficient text" }
    });
  });

  it("marks successful extraction and validated Gemini output as COMPLETED", async () => {
    await expect(runJob()).resolves.toBeUndefined();

    expect(mocks.generateResumeAnalysis).toHaveBeenCalledWith(expect.stringContaining("Experienced software engineer"));
    expect(mocks.findOneAndUpdate).toHaveBeenLastCalledWith({
      _id: "analysis-id",
      candidateId: "candidate-id",
      resumeFileKey: "resumes/candidate-id/resume.docx",
      processingToken,
      analysisStatus: "PROCESSING"
    }, {
      $set: expect.objectContaining({ analysisStatus: "COMPLETED", skills: ["TypeScript"] }),
      $unset: { errorMessage: 1 }
    });
  });

  it("does not restart a failed analysis for a duplicate job token", async () => {
    mocks.findOneAndUpdate.mockResolvedValueOnce(null);

    await expect(runJob()).rejects.toThrow("Resume analysis record not found");

    expect(mocks.findOneAndUpdate).toHaveBeenCalledWith({
      candidateId: "candidate-id",
      resumeFileKey: "resumes/candidate-id/resume.docx",
      processingToken,
      analysisStatus: "PENDING"
    }, expect.anything(), expect.anything());
    expect(mocks.generateResumeAnalysis).not.toHaveBeenCalled();
    expect(mocks.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });
});