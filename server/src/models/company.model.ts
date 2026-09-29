import { Schema, model, Document, Types } from "mongoose";

export interface ICompany extends Document {
  name: string;
  tagline?: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;

  location?: {
    city?: string;
    state?: string;
    country?: string;
  };

  logoUrl?: string;

  ownerId: Types.ObjectId;

  isVerified: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      minlength: [2, "Company name must be at least 2 characters"],
      maxlength: [150, "Company name cannot exceed 150 characters"]
    },

    tagline: {
      type: String,
      trim: true,
      maxlength: [160, "Company tagline cannot exceed 160 characters"]
    },

    description: {
      type: String,
      trim: true,
      maxlength: [3000, "Company description cannot exceed 3000 characters"]
    },

    website: {
      type: String,
      trim: true
    },

    industry: {
      type: String,
      trim: true
    },

    companySize: {
      type: String,
      trim: true
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

    logoUrl: {
      type: String,
      trim: true
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const Company = model<ICompany>(
  "Company",
  companySchema
);