import { Schema, model, Document, Types } from "mongoose";

export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export interface IInterview extends Document {
  applicationId: Types.ObjectId;
  candidateId: Types.ObjectId;
  recruiterId: Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl?: string;
  notes?: string;
  status: InterviewStatus;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IInterview>({
  applicationId: { type: Schema.Types.ObjectId, ref: "Application", required: true, index: true },
  candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  recruiterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, min: 15, max: 240, required: true },
  meetingUrl: { type: String, trim: true },
  notes: { type: String, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["SCHEDULED", "COMPLETED", "CANCELLED"], default: "SCHEDULED" }
}, { timestamps: true });
export const Interview = model<IInterview>("Interview", schema);
