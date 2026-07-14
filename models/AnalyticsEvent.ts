import {
  type Model,
  type Types,
  Schema,
  model,
  models,
} from "mongoose";

export const analyticsEventNames = [
  "PAGE_VIEW",
  "EXTERNAL_CLICK",
  "CONTACT_SUBMIT",
  "SEARCH",
] as const;

export type AnalyticsEventName =
  (typeof analyticsEventNames)[number];

export interface AnalyticsEvent {
  _id: Types.ObjectId;

  eventName: AnalyticsEventName;

  path: string | null;
  targetUrl: string | null;
  referrer: string | null;

  sessionHash: string;

  country: string | null;
  deviceType:
    | "desktop"
    | "mobile"
    | "tablet"
    | "unknown";

  metadata:
    | Record<string, unknown>
    | null;

  occurredAt: Date;
  createdAt: Date;
}

const AnalyticsEventSchema =
  new Schema<AnalyticsEvent>(
    {
      eventName: {
        type: String,
        enum: analyticsEventNames,
        required: true,
        index: true,
      },

      path: {
        type: String,
        default: null,
        maxlength: 500,
        index: true,
      },

      targetUrl: {
        type: String,
        default: null,
        maxlength: 2_000,
      },

      referrer: {
        type: String,
        default: null,
        maxlength: 2_000,
      },

      sessionHash: {
        type: String,
        required: true,
        index: true,
      },

      country: {
        type: String,
        default: null,
        maxlength: 10,
      },

      deviceType: {
        type: String,
        enum: [
          "desktop",
          "mobile",
          "tablet",
          "unknown",
        ],
        default: "unknown",
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: null,
      },

      occurredAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
    },
    {
      timestamps: {
        createdAt: true,
        updatedAt: false,
      },

      collection: "analytics_events",
      minimize: false,
    },
  );

AnalyticsEventSchema.index({
  eventName: 1,
  occurredAt: -1,
});

AnalyticsEventSchema.index({
  path: 1,
  occurredAt: -1,
});

AnalyticsEventSchema.index({
  sessionHash: 1,
  occurredAt: -1,
});

const AnalyticsEventModel =
  (models.AnalyticsEvent as Model<AnalyticsEvent>) ||
  model<AnalyticsEvent>(
    "AnalyticsEvent",
    AnalyticsEventSchema,
  );

export default AnalyticsEventModel;