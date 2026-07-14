"use server";

import {
  isValidObjectId,
} from "mongoose";
import {
  revalidatePath,
} from "next/cache";
import { z } from "zod";

import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";

import AuditLogModel from "@/models/AuditLog";
import ContactMessageModel from "@/models/ContactMessage";

import {
  messageStatuses,
} from "@/types/content";

type MessageActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function setMessageStatusAction(
  _previousState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const session = await requireOwner();

  try {
    const messageId = z
      .string()
      .min(1)
      .parse(
        formData.get("messageId"),
      );

    const nextStatus = z
      .enum(messageStatuses)
      .parse(
        formData.get("nextStatus"),
      );

    if (!isValidObjectId(messageId)) {
      throw new Error(
        "The message ID is invalid.",
      );
    }

    await dbConnect();

    const now = new Date();

    const statusDates: Record<
      string,
      Record<string, Date | null>
    > = {
      NEW: {
        readAt: null,
        repliedAt: null,
        archivedAt: null,
      },

      READ: {
        readAt: now,
        archivedAt: null,
      },

      REPLIED: {
        readAt: now,
        repliedAt: now,
        archivedAt: null,
      },

      ARCHIVED: {
        readAt: now,
        archivedAt: now,
      },

      SPAM: {
        readAt: now,
        archivedAt: now,
      },
    };

    const updated =
      await ContactMessageModel.findByIdAndUpdate(
        messageId,

        {
          $set: {
            status: nextStatus,
            ...statusDates[nextStatus],
          },
        },

        {
          new: true,
          runValidators: true,
        },
      );

    if (!updated) {
      throw new Error(
        "The message could not be found.",
      );
    }

    await AuditLogModel.create({
      action: "UPDATE",

      actorLogin:
        session.user.githubLogin,

      entityType:
        "ContactMessage",

      entityId:
        updated._id,

      description:
        `Changed message status to ${nextStatus}: ${updated.subject}`,
    });

    revalidatePath(
      `/dashboard/messages/${messageId}`,
    );

    revalidatePath(
      "/dashboard/messages",
    );

    revalidatePath("/dashboard");

    return {
      status: "success",

      message:
        `Message marked as ${nextStatus.toLowerCase()}.`,
    };
  } catch (error) {
    return {
      status: "error",

      message:
        error instanceof Error
          ? error.message
          : "The message status could not be changed.",
    };
  }
}