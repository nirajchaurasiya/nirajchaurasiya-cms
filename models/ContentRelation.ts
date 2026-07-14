import {
  type Model,
  type Types,
  Schema,
  model,
  models,
} from "mongoose";
import {
  relationKinds,
  type RelationKind,
} from "@/types/content";

export interface ContentRelation {
  _id: Types.ObjectId;

  sourceId: Types.ObjectId;
  targetId: Types.ObjectId;

  relationKind: RelationKind;
  description: string | null;
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

const ContentRelationSchema =
  new Schema<ContentRelation>(
    {
      sourceId: {
        type: Schema.Types.ObjectId,
        ref: "ContentEntry",
        required: true,
        index: true,
      },

      targetId: {
        type: Schema.Types.ObjectId,
        ref: "ContentEntry",
        required: true,
        index: true,
      },

      relationKind: {
        type: String,
        enum: relationKinds,
        required: true,
      },

      description: {
        type: String,
        default: null,
        maxlength: 1_000,
      },

      sortOrder: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
      collection: "content_relations",
    },
  );

ContentRelationSchema.index(
  {
    sourceId: 1,
    targetId: 1,
    relationKind: 1,
  },
  {
    unique: true,
  },
);

ContentRelationSchema.index({
  sourceId: 1,
  sortOrder: 1,
});

const ContentRelationModel =
  (models.ContentRelation as Model<ContentRelation>) ||
  model<ContentRelation>(
    "ContentRelation",
    ContentRelationSchema,
  );

export default ContentRelationModel;