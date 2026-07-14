import {
  type Model,
  type Types,
  Schema,
  model,
  models,
} from "mongoose";
import {
  messageStatuses,
  type JsonObject,
  type MessageStatus,
} from "@/types/content";

export interface ContactMessage {
  _id: Types.ObjectId;

  name: string;
  email: string;
  reason: string;
  subject: string;
  message: string;

  source: string;
  status: MessageStatus;

  metadata: JsonObject | null;

  receivedAt: Date;
  readAt: Date | null;
  repliedAt: Date | null;
  archivedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema =
  new Schema<ContactMessage>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 180,
        index: true,
      },

      reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80,
      },

      subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 160,
      },

      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5_000,
      },

      source: {
        type: String,
        default: "nirajchaurasiya.com",
        trim: true,
      },

      status: {
        type: String,
        enum: messageStatuses,
        default: "NEW",
        index: true,
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: null,
      },

      receivedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },

      readAt: {
        type: Date,
        default: null,
      },

      repliedAt: {
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
      collection: "contact_messages",
      minimize: false,
    },
  );

ContactMessageSchema.index({
  status: 1,
  receivedAt: -1,
});

ContactMessageSchema.index({
  email: 1,
  receivedAt: -1,
});

const ContactMessageModel =
  (models.ContactMessage as Model<ContactMessage>) ||
  model<ContactMessage>(
    "ContactMessage",
    ContactMessageSchema,
  );

export default ContactMessageModel;