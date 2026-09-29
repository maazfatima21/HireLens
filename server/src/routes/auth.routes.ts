import { Router } from "express";

import {
  register,
  login
} from "../controllers/auth.controller.js";

import {
  authenticate,
  AuthenticatedRequest
} from "../middleware/auth.middleware.js";

import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.get(
  "/me",
  authenticate,
  authorize("CANDIDATE"),
  (req: AuthenticatedRequest, res) => {
    res.status(200).json({
      success: true,
      message: "Authenticated candidate",
      data: {
        userId: req.user?.userId,
        role: req.user?.role
      }
    });
  }
);

export default router;