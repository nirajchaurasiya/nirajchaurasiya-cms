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
import ContentEntryModel from "@/models/ContentEntry";
import ContentRelationModel from "@/models/ContentRelation";

import {
  relationKinds,
} from "@/types/content";

type RelationshipActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function saveRelationshipAction(
  _previousState: RelationshipActionState,
  formData: FormData,
): Promise<RelationshipActionState> {
  const session = await requireOwner();

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
        formData.get("relationKind"),
      );

    const description =
      typeof formData.get(
        "description",
      ) === "string"
        ? String(
            formData.get(
              "description",
            ),
          ).trim()
        : "";

    const sortOrder = z.coerce
      .number()
      .int()
      .min(0)
      .max(10_000)
      .catch(0)
      .parse(
        formData.get("sortOrder"),
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
        )
          .select({
            title: 1,
          })
          .lean(),

        ContentEntryModel.findById(
          targetId,
        )
          .select({
            title: 1,
          })
          .lean(),
      ]);

    if (!source || !target) {
      throw new Error(
        "The source or target content entry no longer exists.",
      );
    }

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
      action: "UPDATE",

      actorLogin:
        session.user.githubLogin,

      entityType:
        "ContentRelation",

      entityId: source._id,

      description:
        `Connected ${source.title} to ${target.title} using ${relationKind}`,
    });

    revalidatePath(
      `/dashboard/content/${sourceId}`,
    );

    return {
      status: "success",
      message:
        `Relationship saved: ${target.title}.`,
    };
  } catch (error) {
    return {
      status: "error",

      message:
        error instanceof Error
          ? error.message
          : "The relationship could not be saved.",
    };
  }
}

export async function removeRelationshipAction(
  _previousState: RelationshipActionState,
  formData: FormData,
): Promise<RelationshipActionState> {
  const session = await requireOwner();

  try {
    const relationId = z
      .string()
      .min(1)
      .parse(
        formData.get("relationId"),
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

    const deleted =
      await ContentRelationModel.findOneAndDelete(
        {
          _id: relationId,
          sourceId,
        },
      );

    if (!deleted) {
      throw new Error(
        "The relationship could not be found.",
      );
    }

    await AuditLogModel.create({
      action: "DELETE",

      actorLogin:
        session.user.githubLogin,

      entityType:
        "ContentRelation",

      entityId: deleted._id,

      description:
        "Removed a content relationship.",
    });

    revalidatePath(
      `/dashboard/content/${sourceId}`,
    );

    return {
      status: "success",
      message:
        "Relationship removed.",
    };
  } catch (error) {
    return {
      status: "error",

      message:
        error instanceof Error
          ? error.message
          : "The relationship could not be removed.",
    };
  }
}