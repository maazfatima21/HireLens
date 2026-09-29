import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applicationFindById: vi.fn(),
  jobFindOne: vi.fn(),
  profileFindOne: vi.fn(),
  createSignedUrl: vi.fn()
}));

vi.mock("../models/application.model.js", () => ({ Application: { findById: mocks.applicationFindById } }));
vi.mock("../models/job.model.js", () => ({ Job: { findOne: mocks.jobFindOne } }));
vi.mock("../models/candidate-profile.model.js", () => ({ CandidateProfile: { findOne: mocks.profileFindOne } }));
vi.mock("../models/resume-analysis.model.js", () => ({ ResumeAnalysis: { findOneAndUpdate: vi.fn(), findOne: vi.fn(), deleteOne: vi.fn() } }));
vi.mock("../config/supabase.js", () => ({
  supabaseResumeBucket: "resumes",
  supabase: { storage: { from: () => ({ createSignedUrl: mocks.createSignedUrl }) } }
}));
vi.mock("../config/redis.js", () => ({ redisConfigured: true }));
vi.mock("../queues/resume.queue.js", () => ({ enqueueResumeAnalysis: vi.fn() }));

import { getApplicationResumeDownloadUrl } from "./resume.service.js";

const recruiterId = "64b000000000000000000001";
const applicationId = "64b000000000000000000002";
const jobId = "64b000000000000000000003";
const fileKey = "resumes/candidate/file.docx";

describe("application resume access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.applicationFindById.mockReturnValue({ select: vi.fn().mockResolvedValue({ jobId, resumeFileKey: fileKey }) });
    mocks.jobFindOne.mockReturnValue({ select: vi.fn().mockResolvedValue({ _id: jobId }) });
    mocks.createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://storage.example/signed" }, error: null });
  });

  it("issues a short-lived URL only after verifying the recruiter owns the job", async () => {
    await expect(getApplicationResumeDownloadUrl(recruiterId, applicationId)).resolves.toBe("https://storage.example/signed");

    expect(mocks.jobFindOne).toHaveBeenCalledWith({ _id: jobId, createdBy: recruiterId });
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(fileKey, 300, { download: true });
  });

  it("denies recruiters who do not own the application job", async () => {
    mocks.jobFindOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });

    await expect(getApplicationResumeDownloadUrl(recruiterId, applicationId)).rejects.toThrow("You do not have access to this application");
    expect(mocks.createSignedUrl).not.toHaveBeenCalled();
  });
});