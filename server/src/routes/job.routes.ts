import { Router } from "express";

import {
  create,
  publish,
  getPublished,
  getPublishedById,
  getMyJobs,
  search,
  update,
  close,
  remove
} from "../controllers/job.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

// Public / candidate routes
router.get(
  "/",
  getPublished
);

router.get(
  "/search",
  search
);

// Recruiter routes
router.post(
  "/",
  authenticate,
  authorize("RECRUITER"),
  create
);

router.get(
  "/recruiter/mine",
  authenticate,
  authorize("RECRUITER"),
  getMyJobs
);

router.patch(
  "/:id",
  authenticate,
  authorize("RECRUITER"),
  update
);

router.patch(
  "/:id/publish",
  authenticate,
  authorize("RECRUITER"),
  publish
);

router.patch(
  "/:id/close",
  authenticate,
  authorize("RECRUITER"),
  close
);

router.delete(
  "/:id",
  authenticate,
  authorize("RECRUITER"),
  remove
);

// Public job details
router.get(
  "/:id",
  getPublishedById
);

export default router;
