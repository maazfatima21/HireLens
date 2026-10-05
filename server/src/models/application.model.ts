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
  contactPhone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  relevantExperienceYears?: number;
  noticePeriod?: string;
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

    contactPhone: {
      type: String,
      trim: true,
      maxlength: 40
    },

    linkedinUrl: {
      type: String,
      trim: true,
      maxlength: 500
    },

    portfolioUrl: {
      type: String,
      trim: true,
      maxlength: 500
    },

    relevantExperienceYears: {
      type: Number,
      min: 0,
      max: 60
    },

    noticePeriod: {
      type: String,
      enum: ["IMMEDIATE", "TWO_WEEKS", "ONE_MONTH", "TWO_MONTHS", "THREE_MONTHS", "OTHER"]
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
