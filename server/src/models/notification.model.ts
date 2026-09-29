import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  link: string;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  link: { type: String, required: true, trim: true, maxlength: 300 },
  readAt: Date
}, { timestamps: true });

notificationSchema.index({ recipientId: 1, createdAt: -1 });

export const Notification = model<INotification>("Notification", notificationSchema);