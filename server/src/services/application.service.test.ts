import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import type { Server } from "node:http";

const mocks = vi.hoisted(() => ({
  jobFindOne: vi.fn(),
  applicationFindOne: vi.fn(),
  applicationCreate: vi.fn(),
  historyCreate: vi.fn(),
  profileFindOne: vi.fn(),
  notifyUser: vi.fn()
}));

vi.mock("../models/job.model.js", () => ({ Job: { findOne: mocks.jobFindOne } }));
vi.mock("../models/application.model.js", () => ({
  Application: {
    findOne: mocks.applicationFindOne,
    create: mocks.applicationCreate
  }
}));
vi.mock("../models/application-status-history.model.js", () => ({
  ApplicationStatusHistory: { create: mocks.historyCreate }
}));
vi.mock("../models/candidate-profile.model.js", () => ({
  CandidateProfile: { findOne: mocks.profileFindOne }
}));
vi.mock("./notification.service.js", () => ({ notifyUser: mocks.notifyUser }));
vi.mock("./resume.service.js", () => ({ getApplicationResumeDownloadUrl: vi.fn() }));

import { apply } from "../controllers/application.controller.js";

const candidateId = "64b000000000000000000001";
const jobId = "64b000000000000000000002";
const applicationId = "64b000000000000000000003";
let server: Server;

describe("POST /api/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.jobFindOne.mockResolvedValue({ _id: jobId, title: "QA Engineer" });
    mocks.applicationFindOne.mockResolvedValue(null);
    mocks.applicationCreate.mockResolvedValue({
      _id: applicationId,
      jobId,
      candidateId,
      status: "APPLIED"
    });
    mocks.historyCreate.mockResolvedValue({});
    mocks.profileFindOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(null)
    });
    mocks.notifyUser.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      });
    }
  });

  it("creates an APPLIED application, records initial history, and returns HTTP 201", async () => {
    const app = express();
    app.use(express.json());
    app.post("/api/applications", (req: Request, _res: Response, next: NextFunction) => {
      (req as Request & { user?: { userId: string; role: string } }).user = {
        userId: candidateId,
        role: "CANDIDATE"
      };
      next();
    }, apply);

    server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        coverLetter: "Interested in this QA role.",
        contactPhone: "+1 555 123 4567",
        linkedinUrl: "https://www.linkedin.com/in/candidate",
        portfolioUrl: "https://portfolio.example.com",
        relevantExperienceYears: 4,
        noticePeriod: "ONE_MONTH",
        informationConfirmed: true,
      })
    });
    const body = await response.json() as {
      success: boolean;
      data?: { application?: { _id?: string; status?: string } };
    };

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data?.application?._id).toBe(applicationId);
    expect(body.data?.application?.status).toBe("APPLIED");
    expect(mocks.applicationCreate).toHaveBeenCalledWith(expect.objectContaining({
      jobId,
      candidateId,
      status: "APPLIED",
      contactPhone: "+1 555 123 4567",
      linkedinUrl: "https://www.linkedin.com/in/candidate",
      portfolioUrl: "https://portfolio.example.com",
      relevantExperienceYears: 4,
      noticePeriod: "ONE_MONTH",
    }));
    expect(mocks.historyCreate).toHaveBeenCalledWith(expect.objectContaining({
      applicationId,
      status: "APPLIED",
      changedBy: candidateId
    }));
    expect(mocks.notifyUser).toHaveBeenCalledWith(expect.objectContaining({
      message: "Your application for QA Engineer is now applied."
    }));
  });

  it("accepts empty optional details and no confirmation flag", async () => {
    const app = express();
    app.use(express.json());
    app.post("/api/applications", (req: Request, _res: Response, next: NextFunction) => {
      (req as Request & { user?: { userId: string; role: string } }).user = {
        userId: candidateId,
        role: "CANDIDATE"
      };
      next();
    }, apply);

    server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
      })
    });

    expect(response.status).toBe(201);
    expect(mocks.applicationCreate).toHaveBeenCalledWith(expect.objectContaining({
      jobId,
      candidateId,
      status: "APPLIED",
      coverLetter: undefined,
      contactPhone: undefined,
      linkedinUrl: undefined,
      portfolioUrl: undefined,
      relevantExperienceYears: undefined,
      noticePeriod: undefined,
    }));
  });
});