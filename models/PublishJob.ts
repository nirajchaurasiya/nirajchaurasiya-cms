import {
  type Model,
  type Types,
  Schema,
  model,
  models,
} from "mongoose";
import {
  publishActions,
  publishJobStatuses,
  type JsonObject,
  type PublishAction,
  type PublishJobStatus,
} from "@/types/content";

export interface PublishJob {
  _id: Types.ObjectId;

  entryId: Types.ObjectId | null;

  action: PublishAction;
  status: PublishJobStatus;

  payload: JsonObject | null;
  response: JsonObject | null;

  responseStatus: number | null;
  attemptCount: number;
  errorMessage: string | null;

  startedAt: Date | null;
  completedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const PublishJobSchema = new Schema<PublishJob>(
  {
    entryId: {
      type: Schema.Types.ObjectId,
      ref: "ContentEntry",
      default: null,
      index: true,
    },

    action: {
      type: String,
      enum: publishActions,
      required: true,
    },

    status: {
      type: String,
      enum: publishJobStatuses,
      default: "PENDING",
      index: true,
    },

    payload: {
      type: Schema.Types.Mixed,
      default: null,
    },

    response: {
      type: Schema.Types.Mixed,
      default: null,
    },

    responseStatus: {
      type: Number,
      default: null,
    },

    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    errorMessage: {
      type: String,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "publish_jobs",
    minimize: false,
  },
);

PublishJobSchema.index({
  status: 1,
  createdAt: 1,
});

const PublishJobModel =
  (models.PublishJob as Model<PublishJob>) ||
  model<PublishJob>(
    "PublishJob",
    PublishJobSchema,
  );

export default PublishJobModel;