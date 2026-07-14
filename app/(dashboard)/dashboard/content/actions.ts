"use server";

import {
  revalidatePath,
} from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createDraft,
  publishEntry,
  saveDraft,
  unpublishEntry,
} from "@/lib/content-service";
import { requireOwner } from "@/lib/authorization";
import {
  contentTypes,
  type ContentType,
  type JsonObject,
} from "@/types/content";

const ContentFormSchema =
  z.object({
    id:
      z.string().optional(),

    type:
      z.enum(contentTypes),

    slug:
      z
        .string()
        .trim()
        .min(2)
        .max(160)
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Use lowercase letters, numbers, and hyphens.",
        ),

    title:
      z
        .string()
        .trim()
        .min(2)
        .max(240),

    summary:
      z
        .string()
        .trim()
        .max(1_200),

    publicPath:
      z
        .string()
        .trim()
        .max(300)
        .optional(),

    draftData:
      z.string().min(2),
  });

function parseJson(
  value: string,
): JsonObject {
  let parsed: unknown;

  try {
    parsed =
      JSON.parse(value);
  } catch {
    throw new Error(
      "Content data must be valid JSON.",
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      "Content data must be a JSON object.",
    );
  }

  return parsed as JsonObject;
}

function parseContentForm(
  formData: FormData,
) {
  const result =
    ContentFormSchema.safeParse({
      id:
        formData.get("id") ||
        undefined,

      type:
        formData.get("type"),

      slug:
        formData.get("slug"),

      title:
        formData.get("title"),

      summary:
        formData.get("summary") ??
        "",

      publicPath:
        formData.get(
          "publicPath",
        ) || undefined,

      draftData:
        formData.get(
          "draftData",
        ),
    });

  if (!result.success) {
    throw new Error(
      result.error.issues
        .map(
          (issue) =>
            issue.message,
        )
        .join(" "),
    );
  }

  return {
    ...result.data,

    type:
      result.data
        .type as ContentType,

    draftData:
      parseJson(
        result.data.draftData,
      ),
  };
}

export async function createContentDraft(
  formData: FormData,
) {
  const session =
    await requireOwner();

  const input =
    parseContentForm(
      formData,
    );

  const entry =
    await createDraft(
      input,

      {
        githubLogin:
          session.user
            .githubLogin,
      },
    );

  redirect(
    `/dashboard/content/${entry._id.toString()}`,
  );
}

export async function saveContentDraft(
  formData: FormData,
) {
  const session =
    await requireOwner();

  const input =
    parseContentForm(
      formData,
    );

  if (!input.id) {
    throw new Error(
      "Content ID is required.",
    );
  }

  await saveDraft(
    input.id,
    input,

    {
      githubLogin:
        session.user
          .githubLogin,
    },
  );

  revalidatePath(
    `/dashboard/content/${input.id}`,
  );

  revalidatePath(
    "/dashboard/content",
  );

  revalidatePath(
    "/dashboard",
  );
}

export async function publishContent(
  formData: FormData,
) {
  const session =
    await requireOwner();

  const id =
    z
      .string()
      .min(1)
      .parse(
        formData.get("id"),
      );

  await publishEntry(
    id,

    {
      githubLogin:
        session.user
          .githubLogin,
    },
  );

  revalidatePath(
    `/dashboard/content/${id}`,
  );

  revalidatePath(
    "/dashboard/content",
  );

  revalidatePath(
    "/dashboard",
  );
}

export async function unpublishContent(
  formData: FormData,
) {
  const session =
    await requireOwner();

  const id =
    z
      .string()
      .min(1)
      .parse(
        formData.get("id"),
      );

  await unpublishEntry(
    id,

    {
      githubLogin:
        session.user
          .githubLogin,
    },
  );

  revalidatePath(
    `/dashboard/content/${id}`,
  );

  revalidatePath(
    "/dashboard/content",
  );

  revalidatePath(
    "/dashboard",
  );
}