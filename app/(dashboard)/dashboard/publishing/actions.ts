"use server";

import {
  isValidObjectId,
} from "mongoose";
import {
  revalidatePath,
} from "next/cache";

import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";
import { processPublishJob } from "@/lib/publishing";

import AuditLogModel from "@/models/AuditLog";
import PublishJobModel from "@/models/PublishJob";

type PublishingActionState = {
  status:
    | "idle"
    | "success"
    | "error";

  message: string;
};

function getErrorMessage(
  error: unknown,
) {
  return error instanceof Error
    ? error.message
    : "The publishing operation could not be completed.";
}

export async function retryPublishJobAction(
  _previousState: PublishingActionState,
  formData: FormData,
): Promise<PublishingActionState> {
  const session =
    await requireOwner();

  try {
    const rawJobId =
      formData.get("jobId");

    if (
      typeof rawJobId !== "string" ||
      !isValidObjectId(rawJobId)
    ) {
      throw new Error(
        "The publishing-job ID is invalid.",
      );
    }

    await dbConnect();

    const job =
      await PublishJobModel.findById(
        rawJobId,
      );

    if (!job) {
      throw new Error(
        "The publishing job could not be found.",
      );
    }

    if (
      ![
        "FAILED",
        "PENDING",
      ].includes(job.status)
    ) {
      throw new Error(
        `A ${job.status.toLowerCase()} job cannot be retried.`,
      );
    }

    job.status = "PENDING";
    job.errorMessage = null;
    job.response = null;
    job.responseStatus = null;
    job.startedAt = null;
    job.completedAt = null;

    await job.save();

    const processed =
      await processPublishJob(
        job._id.toString(),
      );

    await AuditLogModel.create({
      action: "UPDATE",

      actorLogin:
        session.user.githubLogin,

      entityType:
        "PublishJob",

      entityId:
        job._id,

      description:
        `Retried ${job.action} publishing job.`,
    });

    revalidatePath(
      "/dashboard/publishing",
    );

    revalidatePath("/dashboard");

    if (
      processed.status ===
      "FAILED"
    ) {
      return {
        status: "error",

        message:
          processed.errorMessage ??
          "The publishing job failed again.",
      };
    }

    return {
      status: "success",

      message:
        "The publishing job completed successfully.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        getErrorMessage(error),
    };
  }
}

export async function triggerFullSyncAction(
  _previousState: PublishingActionState,
  _formData: FormData,
): Promise<PublishingActionState> {
  const session =
    await requireOwner();

  try {
    await dbConnect();

    const job =
      await PublishJobModel.create({
        entryId: null,

        action: "FULL_SYNC",

        status: "PENDING",

        payload: {
          contentId: "system",
          type: "SYSTEM",
          slug: "all",
          publicPath: null,
          version: null,
          action: "FULL_SYNC",
        },
      });

    const processed =
      await processPublishJob(
        job._id.toString(),
      );

    await AuditLogModel.create({
      action: "UPDATE",

      actorLogin:
        session.user.githubLogin,

      entityType:
        "PublishJob",

      entityId:
        job._id,

      description:
        "Triggered a full public-site synchronization.",
    });

    revalidatePath(
      "/dashboard/publishing",
    );

    revalidatePath("/dashboard");

    if (
      processed.status ===
      "FAILED"
    ) {
      return {
        status: "error",

        message:
          processed.errorMessage ??
          "The full synchronization failed.",
      };
    }

    return {
      status: "success",

      message:
        "The full public-content synchronization completed.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        getErrorMessage(error),
    };
  }
}