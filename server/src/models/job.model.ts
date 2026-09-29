import { Schema, model, Document, Types } from "mongoose";

export type JobType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP";

export type WorkMode =
  | "ONSITE"
  | "REMOTE"
  | "HYBRID";

export type JobStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CLOSED";

export interface IJob extends Document {
  companyId: Types.ObjectId;
  createdBy: Types.ObjectId;

  title: string;
  description: string;

  skills: string[];

  jobType: JobType;
  workMode: WorkMode;

  location?: {
    city?: string;
    state?: string;
    country?: string;
  };

  experienceMin?: number;
  experienceMax?: number;

  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;

  status: JobStatus;

  applicationDeadline?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      minlength: [2, "Job title must be at least 2 characters"],
      maxlength: [150, "Job title cannot exceed 150 characters"]
    },

    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      minlength: [20, "Job description must be at least 20 characters"],
      maxlength: [10000, "Job description cannot exceed 10000 characters"]
    },

    skills: {
      type: [String],
      required: true,
      default: []
    },

    jobType: {
      type: String,
      enum: [
        "FULL_TIME",
        "PART_TIME",
        "CONTRACT",
        "INTERNSHIP"
      ],
      required: true
    },

    workMode: {
      type: String,
      enum: [
        "ONSITE",
        "REMOTE",
        "HYBRID"
      ],
      required: true
    },

    location: {
      city: {
        type: String,
        trim: true
      },

      state: {
        type: String,
        trim: true
      },

      country: {
        type: String,
        trim: true
      }
    },

    experienceMin: {
      type: Number,
      min: 0
    },

    experienceMax: {
      type: Number,
      min: 0
    },

    salaryMin: {
      type: Number,
      min: 0
    },

    salaryMax: {
      type: Number,
      min: 0
    },

    salaryCurrency: {
      type: String,
      default: "Rs.",
      trim: true
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "PUBLISHED",
        "CLOSED"
      ],
      default: "DRAFT",
      index: true
    },

    applicationDeadline: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

jobSchema.index({
  title: "text",
  description: "text",
  skills: "text"
});

export const Job = model<IJob>(
  "Job",
  jobSchema
);