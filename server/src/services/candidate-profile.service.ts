import { Types } from "mongoose";

import { CandidateProfile } from "../models/candidate-profile.model.js";
import { ApiError } from "../utils/api-error.js";

export const getCandidateProfile = async (
  userId: string
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const profile = await CandidateProfile.findOne({
    userId
  });

  if (!profile) {
    throw new ApiError(404, "Candidate profile not found");
  }

  return profile;
};

export const upsertCandidateProfile = async (
  userId: string,
  data: {
    headline?: string;
    bio?: string;
    skills?: string[];
    experience?: unknown[];
    education?: unknown[];
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  }
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const profile = await CandidateProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        ...data,
        userId
      }
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true
    }
  );

  return profile;
};