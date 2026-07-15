import "server-only";
import { isValidObjectId } from "mongoose";

import { dbConnect } from "@/lib/mongodb";
import PublishJobModel from "@/models/PublishJob";

type RevalidationPayload = {
  contentId: string;
  type: string;
  slug: string;
  publicPath: string | null;
  version: number | null;
  action: string;
};

function readResponseBody(value: string) {
  return value.slice(0, 5_000);
}

export async function processPublishJob(jobId: string) {
  if (!isValidObjectId(jobId)) {
    throw new Error("Invalid publishing-job ID.");
  }

  await dbConnect();

  const job = await PublishJobModel.findOneAndUpdate(
    {
      _id: jobId,
      status: "PENDING",
    },

    {
      $set: {
        status: "RUNNING",
        startedAt: new Date(),
        completedAt: null,
        errorMessage: null,
      },

      $inc: {
        attemptCount: 1,
      },
    },

    {
      new: true,
      runValidators: true,
    },
  );

  if (!job) {
    throw new Error("The publishing job is not pending or no longer exists.");
  }

  const revalidationUrl = process.env.PUBLIC_SITE_REVALIDATE_URL?.trim();

  try {
    /*
     * Until the public website has a revalidation
     * endpoint, the protected snapshot API is the
     * source of truth.
     */
    if (!revalidationUrl) {
      job.status = "SUCCEEDED";

      job.response = {
        mode: "snapshot-api",

        message:
          "Published content is available through the protected content API.",
      };

      job.responseStatus = 200;
      job.completedAt = new Date();

      await job.save();

      return job;
    }

    const payload = job.payload as RevalidationPayload | null;

    if (!payload) {
      throw new Error("The publishing job does not contain a payload.");
    }

    const secret = process.env.PUBLIC_SITE_REVALIDATE_SECRET ?? "";

    const response = await fetch(process.env.PUBLIC_SITE_REVALIDATE_URL!, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${process.env.PUBLIC_SITE_REVALIDATE_SECRET}`,
      },

      body: JSON.stringify(job.payload),

      cache: "no-store",
    });

    const responseText = await response.text();

    job.responseStatus = response.status;

    job.response = {
      body: readResponseBody(responseText),
    };

    if (!response.ok) {
      throw new Error(`Public-site revalidation returned ${response.status}.`);
    }

    job.status = "SUCCEEDED";
    job.completedAt = new Date();

    await job.save();

    return job;
  } catch (error) {
    job.status = "FAILED";

    job.errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown publishing error occurred.";

    job.completedAt = new Date();

    await job.save();

    return job;
  }
}
