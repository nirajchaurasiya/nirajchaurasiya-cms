import {
  type Model,
  type Types,
  Schema,
  model,
  models,
} from "mongoose";
import {
  auditActions,
  type AuditAction,
  type JsonObject,
} from "@/types/content";

export interface AuditLog {
  _id: Types.ObjectId;

  action: AuditAction;
  actorLogin: string;

  entityType: string;
  entityId: Types.ObjectId | null;

  description: string;
  metadata: JsonObject | null;

  createdAt: Date;
}

const AuditLogSchema = new Schema<AuditLog>(
  {
    action: {
      type: String,
      enum: auditActions,
      required: true,
      index: true,
    },

    actorLogin: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    entityType: {
      type: String,
      required: true,
      index: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    description: {
      type: String,
      required: true,
      maxlength: 1_000,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },

    collection: "audit_logs",
    minimize: false,
  },
);

AuditLogSchema.index({
  createdAt: -1,
});

const AuditLogModel =
  (models.AuditLog as Model<AuditLog>) ||
  model<AuditLog>(
    "AuditLog",
    AuditLogSchema,
  );

export default AuditLogModel;