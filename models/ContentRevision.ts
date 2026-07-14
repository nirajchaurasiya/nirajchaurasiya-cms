import {
  type Model,
  type Types,
  Schema,
  model,
  models,
} from "mongoose";
import {
  revisionKinds,
  type JsonObject,
  type RevisionKind,
} from "@/types/content";

export interface ContentRevision {
  _id: Types.ObjectId;

  entryId: Types.ObjectId;
  revisionNumber: number;

  kind: RevisionKind;
  snapshot: JsonObject;

  note: string | null;
  actorLogin: string;

  createdAt: Date;
}

const ContentRevisionSchema =
  new Schema<ContentRevision>(
    {
      entryId: {
        type: Schema.Types.ObjectId,
        ref: "ContentEntry",
        required: true,
        index: true,
      },

      revisionNumber: {
        type: Number,
        required: true,
        min: 1,
      },

      kind: {
        type: String,
        enum: revisionKinds,
        required: true,
      },

      snapshot: {
        type: Schema.Types.Mixed,
        required: true,
      },

      note: {
        type: String,
        default: null,
        maxlength: 1_000,
      },

      actorLogin: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
    },
    {
      timestamps: {
        createdAt: true,
        updatedAt: false,
      },

      collection: "content_revisions",
      minimize: false,
    },
  );

ContentRevisionSchema.index(
  {
    entryId: 1,
    revisionNumber: 1,
  },
  {
    unique: true,
  },
);

ContentRevisionSchema.index({
  entryId: 1,
  createdAt: -1,
});

const ContentRevisionModel =
  (models.ContentRevision as Model<ContentRevision>) ||
  model<ContentRevision>(
    "ContentRevision",
    ContentRevisionSchema,
  );

export default ContentRevisionModel;