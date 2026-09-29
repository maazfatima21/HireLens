import { Schema, model, Document, Types } from "mongoose";

export interface IJobMatch extends Document {
  applicationId: Types.ObjectId;
  candidateId: Types.ObjectId;
  jobId: Types.ObjectId;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: boolean;
  recommendations: string[];
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IJobMatch>({
  applicationId: { type: Schema.Types.ObjectId, ref: "Application", required: true, index: true },
  candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
  matchScore: { type: Number, min: 0, max: 100, required: true },
  matchedSkills: { type: [String], default: [] },
  missingSkills: { type: [String], default: [] },
  experienceMatch: { type: Boolean, required: true },
  recommendations: { type: [String], default: [] },
  summary: { type: String, required: true }
}, { timestamps: true });

export const JobMatch = model<IJobMatch>("JobMatch", schema);
