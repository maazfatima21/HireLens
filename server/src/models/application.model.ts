import { Schema, model, Document, Types } from "mongoose";

export type ApplicationStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED";

export interface IApplication extends Document {
  jobId: Types.ObjectId;
  candidateId: Types.ObjectId;

  status: ApplicationStatus;

  coverLetter?: string;
  resumeFileKey?: string;

  appliedAt: Date;
  updatedAt: Date;

  createdAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true
    },

    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: [
        "APPLIED",
        "UNDER_REVIEW",
        "SHORTLISTED",
        "INTERVIEW",
        "SELECTED",
        "REJECTED"
      ],
      default: "APPLIED",
      index: true
    },

    coverLetter: {
      type: String,
      trim: true,
      maxlength: 5000
    },

    resumeFileKey: {
      type: String,
      trim: true
    },

    appliedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

applicationSchema.index(
  {
    jobId: 1,
    candidateId: 1
  },
  {
    unique: true
  }
);

export const Application = model<IApplication>(
  "Application",
  applicationSchema
);
