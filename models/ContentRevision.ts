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

  /**
   * The content version associated with this event.
   *
   * Multiple events may share the same version:
   * v1 CREATED
   * v1 PUBLISHED
   * v1 UNPUBLISHED
   */
  revisionNumber: number;

  kind: RevisionKind;

  snapshot: JsonObject;

  note: string | null;

  actorLogin: string;

  createdAt: Date;
  updatedAt: Date;
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
        default: {},
      },

      note: {
        type: String,
        default: null,
        trim: true,
        maxlength: 1_000,
      },

      actorLogin: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
      },
    },
    {
      timestamps: true,
      collection: "content_revisions",
      minimize: false,
    },
  );

/**
 * Revision history is an event log.
 *
 * This index is intentionally NOT unique because multiple
 * events can belong to the same content version.
 */
ContentRevisionSchema.index({
  entryId: 1,
  createdAt: -1,
});

ContentRevisionSchema.index({
  entryId: 1,
  revisionNumber: -1,
});

ContentRevisionSchema.index({
  entryId: 1,
  kind: 1,
  createdAt: -1,
});

const ContentRevisionModel =
  (models.ContentRevision as Model<ContentRevision>) ||
  model<ContentRevision>(
    "ContentRevision",
    ContentRevisionSchema,
  );

export default ContentRevisionModel;