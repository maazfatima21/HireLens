import { Router } from "express";

import {
  getProfile,
  updateProfile
} from "../controllers/candidate-profile.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("CANDIDATE"),
  getProfile
);

router.put(
  "/",
  authenticate,
  authorize("CANDIDATE"),
  updateProfile
);

export default router;