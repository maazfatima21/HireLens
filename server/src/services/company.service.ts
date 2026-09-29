import { Types } from "mongoose";

import { Company } from "../models/company.model.js";
import { ApiError } from "../utils/api-error.js";

interface CompanyInput {
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
}

export const createCompany = async (
  ownerId: string,
  data: CompanyInput
) => {
  if (!Types.ObjectId.isValid(ownerId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const existingCompany = await Company.findOne({
    ownerId
  });

  if (existingCompany) {
    throw new ApiError(
      409,
      "You already have a company"
    );
  }

  const company = await Company.create({
    ...data,
    ownerId
  });

  return company;
};

export const getRecruiterCompany = async (
  ownerId: string
) => {
  if (!Types.ObjectId.isValid(ownerId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const company = await Company.findOne({
    ownerId
  });

  if (!company) {
    throw new ApiError(
      404,
      "Company not found"
    );
  }

  return company;
};

export const updateRecruiterCompany = async (ownerId: string, data: Partial<CompanyInput>) => {
  if (!Types.ObjectId.isValid(ownerId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  const company = await Company.findOneAndUpdate(
    { ownerId },
    { $set: data },
    { returnDocument: "after", runValidators: true }
  );
  if (!company) throw new ApiError(404, "Company not found");
  return company;
};
