import { Types } from "mongoose";
import { Notification } from "../models/notification.model.js";
import { ApiError } from "../utils/api-error.js";

export const notifyUser = async (input: { recipientId: Types.ObjectId | string; title: string; message: string; link: string }) => {
  try {
    await Notification.create(input);
  } catch (error) {
    console.error("Could not create in-app notification", error);
  }
};

export const listNotifications = async (recipientId: string) => {
  if (!Types.ObjectId.isValid(recipientId)) throw new ApiError(400, "Invalid user ID");
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipientId }).sort({ createdAt: -1 }).limit(100).lean(),
    Notification.countDocuments({ recipientId, readAt: { $exists: false } })
  ]);
  return { notifications, unreadCount };
};

export const markNotificationRead = async (recipientId: string, notificationId: string) => {
  if (!Types.ObjectId.isValid(recipientId) || !Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId },
    { $set: { readAt: new Date() } },
    { returnDocument: "after" }
  ).lean();
  if (!notification) throw new ApiError(404, "Notification not found");
  return notification;
};