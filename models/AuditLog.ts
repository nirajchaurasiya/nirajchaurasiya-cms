import {
  type Model,
  type Types,
  Schema,
  model,
  models,
} from "mongoose";

export interface AuditLog {
  _id: Types.ObjectId;

  action: string;
  actorLogin: string;

  entityType: string;
  entityId: Types.ObjectId | null;

  description: string;
  metadata: Record<string, unknown> | null;

  createdAt: Date;
}

const AuditLogSchema =
  new Schema<AuditLog>(
    {
      action: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 80,
        index: true,
      },

      actorLogin: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
        index: true,
      },

      entityType: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
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
        trim: true,
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

AuditLogSchema.index({
  entityType: 1,
  createdAt: -1,
});

AuditLogSchema.index({
  action: 1,
  createdAt: -1,
});

AuditLogSchema.index({
  actorLogin: 1,
  createdAt: -1,
});

const AuditLogModel =
  (models.AuditLog as Model<AuditLog>) ||
  model<AuditLog>(
    "AuditLog",
    AuditLogSchema,
  );

export default AuditLogModel;