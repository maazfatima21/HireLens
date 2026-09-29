import { Schema, model, Document, Types } from "mongoose";

import { ApplicationStatus } from "./application.model.js";

export interface IApplicationStatusHistory extends Document {
  applicationId: Types.ObjectId;
  status: ApplicationStatus;
  changedBy: Types.ObjectId;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const applicationStatusHistorySchema =
  new Schema<IApplicationStatusHistory>(
    {
      applicationId: {
        type: Schema.Types.ObjectId,
        ref: "Application",
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
        required: true
      },

      changedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
      },

      note: {
        type: String,
        trim: true,
        maxlength: 1000
      }
    },
    {
      timestamps: true
    }
  );

applicationStatusHistorySchema.index({
  applicationId: 1,
  createdAt: 1
});

export const ApplicationStatusHistory =
  model<IApplicationStatusHistory>(
    "ApplicationStatusHistory",
    applicationStatusHistorySchema
  );
