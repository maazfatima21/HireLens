import { Document, model, Schema, Types } from "mongoose";

export type ResumeAnalysisStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface IResumeAnalysis extends Document {
  candidateId: Types.ObjectId;
  resumeFileKey: string;
  processingToken?: string;
  rawText?: string;
  skills: string[];
  experience?: unknown;
  education?: unknown;
  experienceSummary?: string;
  strengths: string[];
  areasForImprovement: string[];
  suggestedRoles: string[];
  professionalSummary?: string;
  analysisStatus: ResumeAnalysisStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const analysisSchema = new Schema<IResumeAnalysis>({
  candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  resumeFileKey: { type: String, required: true },
  processingToken: String,
  rawText: String,
  skills: { type: [String], default: [] },
  experience: Schema.Types.Mixed,
  education: Schema.Types.Mixed,
  experienceSummary: String,
  strengths: { type: [String], default: [] },
  areasForImprovement: { type: [String], default: [] },
  suggestedRoles: { type: [String], default: [] },
  professionalSummary: String,
  analysisStatus: { type: String, enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"], default: "PENDING", index: true },
  errorMessage: String
}, { collection: "resumeanalyses", timestamps: true });

export const ResumeAnalysis = model<IResumeAnalysis>("ResumeAnalysis", analysisSchema);