import { Router } from "express";

import {
  create,
  getCompany,
  update
} from "../controllers/company.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("RECRUITER"),
  create
);

router.get(
  "/",
  authenticate,
  authorize("RECRUITER"),
  getCompany
);

router.patch(
  "/",
  authenticate,
  authorize("RECRUITER"),
  update
);

export default router;
