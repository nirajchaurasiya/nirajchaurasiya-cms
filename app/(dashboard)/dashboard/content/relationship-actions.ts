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
import {
  requestPublicRevalidation,
} from "@/lib/public-revalidation";

import AuditLogModel from "@/models/AuditLog";
import ContentEntryModel from "@/models/ContentEntry";
import ContentRelationModel from "@/models/ContentRelation";

import {
  relationKinds,
} from "@/types/content";

type RelationshipActionState = {
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
    : "An unknown error occurred.";
}

type RevalidationEntry = {
  _id: {
    toString(): string;
  };

  type: string;
  slug: string;
  publicPath?: string | null;
  publicationStatus: string;
  publishedVersion?: number | null;
};

async function refreshPublishedSource(
  source: RevalidationEntry,
  action:
    | "RELATIONSHIP_UPDATED"
    | "RELATIONSHIP_REMOVED",
): Promise<string | null> {
  if (
    source.publicationStatus !==
    "PUBLISHED"
  ) {
    return null;
  }

  try {
    const result =
      await requestPublicRevalidation({
        contentId:
          source._id.toString(),

        type: source.type,

        slug: source.slug,

        publicPath:
          source.publicPath ?? null,

        version:
          typeof source.publishedVersion ===
          "number"
            ? source.publishedVersion
            : null,

        action,
      });

    if (result.skipped) {
      return result.body;
    }

    return null;
  } catch (error) {
    return getErrorMessage(error);
  }
}

export async function saveRelationshipAction(
  _previousState: RelationshipActionState,
  formData: FormData,
): Promise<RelationshipActionState> {
  const session =
    await requireOwner();

  try {
    const sourceId = z
      .string()
      .min(1)
      .parse(
        formData.get("sourceId"),
      );

    const targetId = z
      .string()
      .min(1)
      .parse(
        formData.get("targetId"),
      );

    const relationKind = z
      .enum(relationKinds)
      .parse(
        formData.get(
          "relationKind",
        ),
      );

    const rawDescription =
      formData.get("description");

    const description =
      typeof rawDescription ===
      "string"
        ? rawDescription.trim()
        : "";

    const sortOrder = z.coerce
      .number()
      .int()
      .min(0)
      .max(10_000)
      .catch(0)
      .parse(
        formData.get(
          "sortOrder",
        ),
      );

    if (
      !isValidObjectId(sourceId) ||
      !isValidObjectId(targetId)
    ) {
      throw new Error(
        "A relationship contains an invalid content ID.",
      );
    }

    if (sourceId === targetId) {
      throw new Error(
        "An entry cannot relate to itself.",
      );
    }

    await dbConnect();

    const [source, target] =
      await Promise.all([
        ContentEntryModel.findById(
          sourceId,
        ).select({
          title: 1,
          type: 1,
          slug: 1,
          publicPath: 1,
          publicationStatus: 1,
          publishedVersion: 1,
        }),

        ContentEntryModel.findById(
          targetId,
        ).select({
          title: 1,
          type: 1,
          slug: 1,
          publicationStatus: 1,
        }),
      ]);

    if (!source || !target) {
      throw new Error(
        "The source or target content entry no longer exists.",
      );
    }

    const relationship =
      await ContentRelationModel.findOneAndUpdate(
        {
          sourceId,
          targetId,
          relationKind,
        },

        {
          $set: {
            description:
              description || null,

            sortOrder,
          },

          $setOnInsert: {
            sourceId,
            targetId,
            relationKind,
          },
        },

        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );

    await AuditLogModel.create({
      action:
        "RELATIONSHIP_CREATED",

      actorLogin:
        session.user.githubLogin,

      entityType:
        "ContentRelation",

      entityId:
        relationship._id,

      description:
        `Connected ${source.title} to ${target.title} using ${relationKind}.`,

      metadata: {
        sourceId:
          source._id.toString(),

        targetId:
          target._id.toString(),

        sourceType:
          source.type,

        targetType:
          target.type,

        relationKind,
      },
    });

    const refreshWarning =
      await refreshPublishedSource(
        source,
        "RELATIONSHIP_UPDATED",
      );

    revalidatePath(
      `/dashboard/content/${sourceId}`,
    );

    revalidatePath(
      "/dashboard/activity",
    );

    if (refreshWarning) {
      return {
        status: "success",

        message:
          `Relationship saved: ${target.title}. Public refresh warning: ${refreshWarning}`,
      };
    }

    return {
      status: "success",

      message:
        `Relationship saved: ${target.title}. The public page was refreshed.`,
    };
  } catch (error) {
    return {
      status: "error",

      message:
        getErrorMessage(error),
    };
  }
}

export async function removeRelationshipAction(
  _previousState: RelationshipActionState,
  formData: FormData,
): Promise<RelationshipActionState> {
  const session =
    await requireOwner();

  try {
    const relationId = z
      .string()
      .min(1)
      .parse(
        formData.get(
          "relationId",
        ),
      );

    const sourceId = z
      .string()
      .min(1)
      .parse(
        formData.get("sourceId"),
      );

    if (
      !isValidObjectId(
        relationId,
      ) ||
      !isValidObjectId(sourceId)
    ) {
      throw new Error(
        "The relationship ID is invalid.",
      );
    }

    await dbConnect();

    const [source, deleted] =
      await Promise.all([
        ContentEntryModel.findById(
          sourceId,
        ).select({
          title: 1,
          type: 1,
          slug: 1,
          publicPath: 1,
          publicationStatus: 1,
          publishedVersion: 1,
        }),

        ContentRelationModel.findOneAndDelete(
          {
            _id: relationId,
            sourceId,
          },
        ),
      ]);

    if (!source) {
      throw new Error(
        "The source content entry could not be found.",
      );
    }

    if (!deleted) {
      throw new Error(
        "The relationship could not be found.",
      );
    }

    await AuditLogModel.create({
      action:
        "RELATIONSHIP_REMOVED",

      actorLogin:
        session.user.githubLogin,

      entityType:
        "ContentRelation",

      entityId:
        deleted._id,

      description:
        `Removed a relationship from ${source.title}.`,

      metadata: {
        sourceId:
          source._id.toString(),

        targetId:
          deleted.targetId.toString(),

        relationKind:
          deleted.relationKind,
      },
    });

    const refreshWarning =
      await refreshPublishedSource(
        source,
        "RELATIONSHIP_REMOVED",
      );

    revalidatePath(
      `/dashboard/content/${sourceId}`,
    );

    revalidatePath(
      "/dashboard/activity",
    );

    if (refreshWarning) {
      return {
        status: "success",

        message:
          `Relationship removed. Public refresh warning: ${refreshWarning}`,
      };
    }

    return {
      status: "success",

      message:
        "Relationship removed. The public page was refreshed.",
    };
  } catch (error) {
    return {
      status: "error",

      message:
        getErrorMessage(error),
    };
  }
}