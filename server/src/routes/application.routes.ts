import { Router } from "express";

import {
  apply,
  getMyApplications,
  getApplicantsForJob,
  updateStatus,
  getRecruiterApplicationsList,
  getApplicationDetails,
  getApplicationHistoryDetails,
  getApplicationResume
} from "../controllers/application.controller.js";
import { createMatch, getMatch } from "../controllers/matching.controller.js";

import {
  authenticate
} from "../middleware/auth.middleware.js";

import {
  authorize
} from "../middleware/role.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("CANDIDATE"),
  apply
);

router.get(
  "/my",
  authenticate,
  authorize("CANDIDATE"),
  getMyApplications
);

router.get(
  "/recruiter",
  authenticate,
  authorize("RECRUITER"),
  getRecruiterApplicationsList
);

router.get(
  "/job/:jobId",
  authenticate,
  authorize("RECRUITER"),
  getApplicantsForJob
);

router.get(
  "/:applicationId/resume",
  authenticate,
  authorize("RECRUITER"),
  getApplicationResume
);

router.get(
  "/:applicationId/history",
  authenticate,
  getApplicationHistoryDetails
);

router.post(
  "/:applicationId/match",
  authenticate,
  authorize("CANDIDATE"),
  createMatch
);

router.get(
  "/:applicationId/match",
  authenticate,
  authorize("CANDIDATE"),
  getMatch
);

router.get(
  "/:applicationId",
  authenticate,
  getApplicationDetails
);

router.patch(
  "/:applicationId/status",
  authenticate,
  authorize("RECRUITER"),
  updateStatus
);

export default router;
