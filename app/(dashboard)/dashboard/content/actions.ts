"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOwner } from "@/lib/authorization";
import {
  createDraft,
  publishEntry,
  saveDraft,
  unpublishEntry,
} from "@/lib/content-service";
import { parseContentForm } from "@/lib/content-validation";

type ContentActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The operation could not be completed.";
}

export async function createContentAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const session = await requireOwner();

  let createdEntryId: string;

  try {
    const input = parseContentForm(formData);

    const entry = await createDraft(input, {
      githubLogin: session.user.githubLogin,
    });

    createdEntryId = entry._id.toString();

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/content");
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error),
    };
  }

  redirect(`/dashboard/content/${createdEntryId}`);
}

export async function updateContentAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const session = await requireOwner();

  try {
    const input = parseContentForm(formData);

    if (
      !input.id ||
      input.expectedDraftVersion === undefined
    ) {
      throw new Error(
        "The content ID and draft version are required.",
      );
    }

    const updated = await saveDraft(
      input.id,
      input.expectedDraftVersion,
      input,
      {
        githubLogin: session.user.githubLogin,
      },
    );

    revalidatePath(
      `/dashboard/content/${input.id}`,
    );

    revalidatePath("/dashboard/content");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message:
        `Draft version ${updated.draftVersion} was saved. Reload the page before editing again.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error),
    };
  }
}

export async function publishContentAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const session = await requireOwner();

  try {
    const id = z
      .string()
      .min(1)
      .parse(formData.get("id"));

    const expectedDraftVersion = z.coerce
      .number()
      .int()
      .positive()
      .parse(
        formData.get("expectedDraftVersion"),
      );

    const published = await publishEntry(
      id,
      expectedDraftVersion,
      {
        githubLogin: session.user.githubLogin,
      },
    );

    revalidatePath(
      `/dashboard/content/${id}`,
    );

    revalidatePath("/dashboard/content");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/publishing");

    return {
      status: "success",
      message:
        `Version ${published.publishedVersion} is now public.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error),
    };
  }
}

export async function unpublishContentAction(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const session = await requireOwner();

  try {
    const id = z
      .string()
      .min(1)
      .parse(formData.get("id"));

    await unpublishEntry(id, {
      githubLogin: session.user.githubLogin,
    });

    revalidatePath(
      `/dashboard/content/${id}`,
    );

    revalidatePath("/dashboard/content");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/publishing");

    return {
      status: "success",
      message:
        "The entry is no longer public.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error),
    };
  }
}