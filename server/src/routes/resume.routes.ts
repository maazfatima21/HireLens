import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { resumeUpload } from "../middleware/upload.middleware.js";
import { analysis, get, remove, retryAnalysis, upload } from "../controllers/resume.controller.js";

const router = Router();
router.post("/upload", authenticate, authorize("CANDIDATE"), resumeUpload.single("resume"), upload);
router.post("/", authenticate, authorize("CANDIDATE"), resumeUpload.single("resume"), upload);
router.post("/analysis/retry", authenticate, authorize("CANDIDATE"), retryAnalysis);
router.get("/analysis", authenticate, authorize("CANDIDATE"), analysis);
router.get("/", authenticate, authorize("CANDIDATE"), get);
router.delete("/", authenticate, authorize("CANDIDATE"), remove);
export default router;
