import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { listNotifications, markNotificationRead } from "../services/notification.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await listNotifications(req.user!.userId);
  res.status(200).json(successResponse("Notifications retrieved successfully", result));
});

export const read = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const notification = await markNotificationRead(req.user!.userId, req.params.id as string);
  res.status(200).json(successResponse("Notification marked as read", { notification }));
});