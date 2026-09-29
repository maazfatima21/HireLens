import { Schema, model, Document, Types } from "mongoose";

export interface IExperience {
  company: string;
  jobTitle: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description?: string;
}

export interface IEducation {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ICandidateProfile extends Document {
  userId: Types.ObjectId;

  headline?: string;
  bio?: string;

  skills: string[];

  experience: IExperience[];

  education: IEducation[];

  location?: {
    city?: string;
    state?: string;
    country?: string;
  };

  resume?: {
    fileName: string;
    fileKey: string;
    fileUrl?: string;
    uploadedAt: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

const experienceSchema = new Schema<IExperience>(
  {
    company: {
      type: String,
      required: true,
      trim: true
    },

    jobTitle: {
      type: String,
      required: true,
      trim: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date
    },

    isCurrent: {
      type: Boolean,
      default: false
    },

    description: {
      type: String,
      trim: true
    }
  },
  {
    _id: false
  }
);

const educationSchema = new Schema<IEducation>(
  {
    institution: {
      type: String,
      required: true,
      trim: true
    },

    degree: {
      type: String,
      required: true,
      trim: true
    },

    fieldOfStudy: {
      type: String,
      trim: true
    },

    startDate: {
      type: Date
    },

    endDate: {
      type: Date
    }
  },
  {
    _id: false
  }
);

const candidateProfileSchema = new Schema<ICandidateProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    headline: {
      type: String,
      trim: true,
      maxlength: 150
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 2000
    },

    skills: {
      type: [String],
      default: []
    },

    experience: {
      type: [experienceSchema],
      default: []
    },

    education: {
      type: [educationSchema],
      default: []
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

    resume: {
      fileName: {
        type: String,
        trim: true
      },

      fileKey: {
        type: String,
        trim: true
      },

      fileUrl: {
        type: String,
        trim: true
      },

      uploadedAt: {
        type: Date
      }
    }
  },
  {
    timestamps: true
  }
);

export const CandidateProfile = model<ICandidateProfile>(
  "CandidateProfile",
  candidateProfileSchema
);