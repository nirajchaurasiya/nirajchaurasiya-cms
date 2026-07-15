import { type Model, type Types, Schema, model, models } from "mongoose";
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
  sourcePath: string | null;
  ipHash: string | null;
  metadata: JsonObject | null;
  userAgent: any;

  receivedAt: Date;
  readAt: Date | null;
  repliedAt: Date | null;
  archivedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema(
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
      maxlength: 200,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    reason: {
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

    sourcePath: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "/contact",
    },

    status: {
      type: String,
      enum: messageStatuses,
      default: "NEW",
      index: true,
    },

    ipHash: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      maxlength: 500,
      default: "",
    },

    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "contact_messages",
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
  model<ContactMessage>("ContactMessage", ContactMessageSchema);

export default ContactMessageModel;
