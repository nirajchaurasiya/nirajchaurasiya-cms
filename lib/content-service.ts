import "server-only";
import {
  isValidObjectId,
} from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";
import ContentEntry from "@/models/ContentEntry";
import ContentRevision from "@/models/ContentRevision";
import PublishJob from "@/models/PublishJob";
import type {
  ContentType,
  JsonObject,
} from "@/types/content";

export type ContentDraftInput = {
  type: ContentType;
  slug: string;
  title: string;
  summary: string;
  publicPath?: string | null;
  draftData: JsonObject;
};

type Actor = {
  githubLogin: string;
};

function normalizeSlug(
  slug: string,
) {
  return slug
    .trim()
    .toLowerCase();
}

function ensureObjectId(
  id: string,
) {
  if (!isValidObjectId(id)) {
    throw new Error(
      "Invalid content ID.",
    );
  }
}

export async function createDraft(
  input: ContentDraftInput,
  actor: Actor,
) {
  await dbConnect();

  const entry =
    await ContentEntry.create({
      type: input.type,

      slug:
        normalizeSlug(
          input.slug,
        ),

      title:
        input.title.trim(),

      summary:
        input.summary.trim(),

      publicPath:
        input.publicPath
          ?.trim() || null,

      workflowStatus:
        "DRAFT",

      publicationStatus:
        "NEVER_PUBLISHED",

      draftData:
        input.draftData,

      publishedData: null,

      draftVersion: 1,

      publishedVersion: null,
    });

  await Promise.all([
    ContentRevision.create({
      entryId: entry._id,

      revisionNumber: 1,

      kind: "CREATED",

      snapshot:
        input.draftData,

      actorLogin:
        actor.githubLogin,
    }),

    AuditLog.create({
      action: "CREATE",

      actorLogin:
        actor.githubLogin,

      entityType:
        "ContentEntry",

      entityId: entry._id,

      description:
        `Created ${entry.type} draft: ${entry.title}`,
    }),
  ]);

  return entry;
}

export async function saveDraft(
  id: string,
  input: ContentDraftInput,
  actor: Actor,
) {
  ensureObjectId(id);
  await dbConnect();

  const current =
    await ContentEntry.findById(id)
      .lean();

  if (!current) {
    throw new Error(
      "Content entry was not found.",
    );
  }

  if (
    current.workflowStatus ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Archived content must be restored before editing.",
    );
  }

  const nextVersion =
    current.draftVersion + 1;

  /*
   * Including the current draftVersion
   * in the query prevents one editor
   * from silently overwriting a newer
   * version.
   */
  const updated =
    await ContentEntry.findOneAndUpdate(
      {
        _id: id,
        draftVersion:
          current.draftVersion,
      },

      {
        $set: {
          type: input.type,

          slug:
            normalizeSlug(
              input.slug,
            ),

          title:
            input.title.trim(),

          summary:
            input.summary.trim(),

          publicPath:
            input.publicPath
              ?.trim() || null,

          draftData:
            input.draftData,

          workflowStatus:
            "DRAFT",
        },

        $inc: {
          draftVersion: 1,
        },
      },

      {
        new: true,
        runValidators: true,
      },
    );

  if (!updated) {
    throw new Error(
      "This content changed before your save completed. Reload the entry and try again.",
    );
  }

  await Promise.all([
    ContentRevision.create({
      entryId: updated._id,

      revisionNumber:
        nextVersion,

      kind: "DRAFT_SAVE",

      snapshot:
        input.draftData,

      actorLogin:
        actor.githubLogin,
    }),

    AuditLog.create({
      action: "UPDATE",

      actorLogin:
        actor.githubLogin,

      entityType:
        "ContentEntry",

      entityId:
        updated._id,

      description:
        `Saved draft version ${nextVersion}: ${updated.title}`,
    }),
  ]);

  return updated;
}

export async function publishEntry(
  id: string,
  actor: Actor,
) {
  ensureObjectId(id);
  await dbConnect();

  const current =
    await ContentEntry.findById(id)
      .lean();

  if (!current) {
    throw new Error(
      "Content entry was not found.",
    );
  }

  if (
    current.workflowStatus ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Archived content cannot be published.",
    );
  }

  const publishedAt =
    new Date();

  /*
   * This single-document update is atomic.
   *
   * The working draft is copied into the
   * separate public snapshot.
   */
  const updated =
    await ContentEntry.findOneAndUpdate(
      {
        _id: id,

        draftVersion:
          current.draftVersion,
      },

      {
        $set: {
          publishedData:
            current.draftData,

          publishedVersion:
            current.draftVersion,

          publicationStatus:
            "PUBLISHED",

          workflowStatus:
            "SYNCED",

          publishedAt,

          unpublishedAt: null,
        },
      },

      {
        new: true,
        runValidators: true,
      },
    );

  if (!updated) {
    throw new Error(
      "The draft changed before publication completed. Reload the entry before publishing.",
    );
  }

  const [
    revision,
    job,
  ] = await Promise.all([
    ContentRevision.create({
      entryId: updated._id,

      revisionNumber:
        current.draftVersion,

      kind: "PUBLISHED",

      snapshot:
        current.draftData,

      note:
        "Copied the working draft into the public snapshot.",

      actorLogin:
        actor.githubLogin,
    }),

    PublishJob.create({
      entryId:
        updated._id,

      action: "PUBLISH",

      status: "PENDING",

      payload: {
        contentId:
          updated._id.toString(),

        type:
          updated.type,

        slug:
          updated.slug,

        publicPath:
          updated.publicPath,

        version:
          updated.publishedVersion,
      },
    }),

    AuditLog.create({
      action: "PUBLISH",

      actorLogin:
        actor.githubLogin,

      entityType:
        "ContentEntry",

      entityId:
        updated._id,

      description:
        `Published ${updated.title} version ${updated.publishedVersion}`,
    }),
  ]);

  return {
    entry: updated,
    revision,
    job,
  };
}

export async function unpublishEntry(
  id: string,
  actor: Actor,
) {
  ensureObjectId(id);
  await dbConnect();

  const updated =
    await ContentEntry.findByIdAndUpdate(
      id,

      {
        $set: {
          publicationStatus:
            "UNPUBLISHED",

          workflowStatus:
            "DRAFT",

          unpublishedAt:
            new Date(),
        },
      },

      {
        new: true,
        runValidators: true,
      },
    );

  if (!updated) {
    throw new Error(
      "Content entry was not found.",
    );
  }

  await Promise.all([
    PublishJob.create({
      entryId:
        updated._id,

      action: "UNPUBLISH",

      status: "PENDING",

      payload: {
        contentId:
          updated._id.toString(),

        publicPath:
          updated.publicPath,
      },
    }),

    AuditLog.create({
      action: "UNPUBLISH",

      actorLogin:
        actor.githubLogin,

      entityType:
        "ContentEntry",

      entityId:
        updated._id,

      description:
        `Unpublished ${updated.title}`,
    }),
  ]);

  return updated;
}