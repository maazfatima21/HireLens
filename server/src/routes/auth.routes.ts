import { Router } from "express";

import {
  register,
  login,
  logout,
  me,
} from "../controllers/auth.controller.js";

import {
  authenticate,
  AuthenticatedRequest
} from "../middleware/auth.middleware.js";

import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", authenticate, logout);

router.get(
  "/me",
  authenticate,
  authorize("CANDIDATE", "RECRUITER", "ADMIN"),
  me
);

export default router;