import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { list, read } from "../controllers/notification.controller.js";

const router = Router();
router.use(authenticate);
router.get("/", list);
router.patch("/:id/read", read);
export default router;