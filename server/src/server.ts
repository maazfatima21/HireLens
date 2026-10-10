import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { validateServerEnvironment } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { successResponse } from "./utils/api-response.js";
import authRoutes from "./routes/auth.routes.js";
import candidateProfileRoutes from "./routes/candidate-profile.routes.js";
import companyRoutes from "./routes/company.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import savedJobRoutes from "./routes/saved-job.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { authRateLimit } from "./middleware/rate-limit.middleware.js";
import { validateCsrfRequest } from "./utils/csrf.js";

const app = express();
validateServerEnvironment();
const PORT = Number(process.env.PORT || 5000);
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const requireCsrfForMutations = (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
): void => {
  try {
    validateCsrfRequest(req, ["/api/auth/login", "/api/auth/register"]);
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(requireCsrfForMutations);

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json(
    successResponse("HireLens API is running", {
      timestamp: new Date().toISOString()
    })
  );
});

// Routes
app.use("/api/auth", authRateLimit, authRoutes);
app.use("/api/profile", candidateProfileRoutes);
app.use("/api/profile/resume", resumeRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/saved-jobs", savedJobRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use(errorMiddleware);

// Start application
const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HireLens API running on port ${PORT}`);
  });
};

startServer();