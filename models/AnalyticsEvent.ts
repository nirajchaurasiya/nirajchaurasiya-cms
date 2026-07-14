import {
  InferSchemaType,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

const AnalyticsEventSchema =
  new Schema(
    {
      eventName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        index: true,
      },

      path: {
        type: String,
        default: null,
        index: true,
      },

      referrer: {
        type: String,
        default: null,
      },

      sessionHash: {
        type: String,
        default: null,
        index: true,
      },

      country: {
        type: String,
        default: null,
      },

      deviceType: {
        type: String,
        default: null,
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
      collection:
        "analytics_events",

      timestamps: false,

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

export type AnalyticsEventDocument =
  InferSchemaType<
    typeof AnalyticsEventSchema
  >;

const AnalyticsEvent =
  (models.AnalyticsEvent as Model<AnalyticsEventDocument>) ||
  model<AnalyticsEventDocument>(
    "AnalyticsEvent",
    AnalyticsEventSchema,
  );

export default AnalyticsEvent;