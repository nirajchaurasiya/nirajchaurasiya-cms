import {
  type Model,
  type Types,
  Schema,
  model,
  models,
} from "mongoose";
import {
  contentTypes,
  publicationStatuses,
  workflowStatuses,
  type ContentType,
  type JsonObject,
  type PublicationStatus,
  type WorkflowStatus,
} from "@/types/content";

export interface ContentEntry {
  _id: Types.ObjectId;

  type: ContentType;
  slug: string;
  title: string;
  summary: string;

  publicPath: string | null;
  featured: boolean;

  workflowStatus: WorkflowStatus;
  publicationStatus: PublicationStatus;

  /**
   * Editable private version.
   */
  draftData: JsonObject;

  /**
   * Separate version currently exposed publicly.
   */
  publishedData: JsonObject | null;

  draftVersion: number;
  publishedVersion: number | null;

  scheduledFor: Date | null;
  publishedAt: Date | null;
  unpublishedAt: Date | null;
  archivedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const ContentEntrySchema = new Schema<ContentEntry>(
  {
    type: {
      type: String,
      enum: contentTypes,
      required: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },

    summary: {
      type: String,
      default: "",
      maxlength: 1_200,
    },

    publicPath: {
      type: String,
      default: null,
      maxlength: 300,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    workflowStatus: {
      type: String,
      enum: workflowStatuses,
      default: "DRAFT",
      index: true,
    },

    publicationStatus: {
      type: String,
      enum: publicationStatuses,
      default: "NEVER_PUBLISHED",
      index: true,
    },

    draftData: {
      type: Schema.Types.Mixed,
      required: true,
    },

    publishedData: {
      type: Schema.Types.Mixed,
      default: null,
    },

    draftVersion: {
      type: Number,
      default: 1,
      min: 1,
    },

    publishedVersion: {
      type: Number,
      default: null,
    },

    scheduledFor: {
      type: Date,
      default: null,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    unpublishedAt: {
      type: Date,
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "content_entries",
    minimize: false,
  },
);

ContentEntrySchema.index(
  {
    type: 1,
    slug: 1,
  },
  {
    unique: true,
  },
);

ContentEntrySchema.index({
  type: 1,
  workflowStatus: 1,
  updatedAt: -1,
});

ContentEntrySchema.index({
  publicationStatus: 1,
  publishedAt: -1,
});

const ContentEntryModel =
  (models.ContentEntry as Model<ContentEntry>) ||
  model<ContentEntry>(
    "ContentEntry",
    ContentEntrySchema,
  );

export default ContentEntryModel;