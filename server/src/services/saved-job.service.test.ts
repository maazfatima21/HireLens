import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  jobFindOne: vi.fn(),
  jobFind: vi.fn(),
  savedFind: vi.fn(),
  savedUpdate: vi.fn(),
  savedDelete: vi.fn()
}));

vi.mock("../models/job.model.js", () => ({ Job: { findOne: mocks.jobFindOne, find: mocks.jobFind } }));
vi.mock("../models/saved-job.model.js", () => ({ SavedJob: { find: mocks.savedFind, updateOne: mocks.savedUpdate, deleteOne: mocks.savedDelete } }));

import { listSavedJobs, removeSavedJob, saveJob } from "./saved-job.service.js";

const candidateId = "64b000000000000000000001";
const firstJobId = "64b000000000000000000002";
const secondJobId = "64b000000000000000000003";

describe("saved jobs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves only published jobs and uses an idempotent upsert", async () => {
    mocks.jobFindOne.mockReturnValue({ select: vi.fn().mockResolvedValue({ _id: firstJobId }) });
    mocks.savedUpdate.mockResolvedValue({ acknowledged: true });

    await saveJob(candidateId, firstJobId);

    expect(mocks.savedUpdate).toHaveBeenCalledWith(
      { candidateId, jobId: firstJobId },
      { $setOnInsert: { candidateId, jobId: firstJobId } },
      { upsert: true }
    );
  });

  it("does not expose unpublished or removed jobs in the saved list", async () => {
    const saved = [{ jobId: firstJobId }, { jobId: secondJobId }];
    const visibleJobs = [{ _id: firstJobId, title: "Published role" }];
    mocks.savedFind.mockReturnValue({ sort: () => ({ select: async () => saved }) });
    mocks.jobFind.mockReturnValue({ populate: async () => visibleJobs });

    await expect(listSavedJobs(candidateId)).resolves.toEqual(visibleJobs);
    expect(mocks.jobFind).toHaveBeenCalledWith({ _id: { $in: [firstJobId, secondJobId] }, status: "PUBLISHED" });
  });

  it("removes a saved job only for the requesting candidate", async () => {
    mocks.savedDelete.mockResolvedValue({ deletedCount: 1 });

    await removeSavedJob(candidateId, firstJobId);

    expect(mocks.savedDelete).toHaveBeenCalledWith({ candidateId, jobId: firstJobId });
  });
});