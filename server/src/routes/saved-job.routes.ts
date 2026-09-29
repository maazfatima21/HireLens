import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { list, remove, save } from "../controllers/saved-job.controller.js";

const router = Router();
router.use(authenticate, authorize("CANDIDATE"));
router.get("/", list);
router.put("/:jobId", save);
router.delete("/:jobId", remove);
export default router;