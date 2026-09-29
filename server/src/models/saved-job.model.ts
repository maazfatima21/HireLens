import { Schema, model, Document, Types } from "mongoose";

export interface ISavedJob extends Document {
  candidateId: Types.ObjectId;
  jobId: Types.ObjectId;
  createdAt: Date;
}

const savedJobSchema = new Schema<ISavedJob>({
  candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true }
}, { timestamps: true });

savedJobSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

export const SavedJob = model<ISavedJob>("SavedJob", savedJobSchema);