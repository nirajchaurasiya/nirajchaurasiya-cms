import "server-only";
import { isValidObjectId } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { processPublishJob } from "@/lib/publishing";
import AuditLogModel from "@/models/AuditLog";
import ContentEntryModel from "@/models/ContentEntry";
import ContentRevisionModel from "@/models/ContentRevision";
import PublishJobModel from "@/models/PublishJob";
import type {
  ContentType,
  JsonObject,
} from "@/types/content";

export type ContentDraftInput = {
  type: ContentType;
  slug: string;
  title: string;
  summary: string;
  publicPath: string | null;
  featured: boolean;
  draftData: JsonObject;
};

type Actor = {
  githubLogin: string;
};

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

function validateObjectId(id: string) {
  if (!isValidObjectId(id)) {
    throw new Error("Invalid content-entry ID.");
  }
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    Reflect.get(error, "code") === 11000
  );
}

export async function createDraft(
  input: ContentDraftInput,
  actor: Actor,
) {
  await dbConnect();

  try {
    const entry = await ContentEntryModel.create({
      type: input.type,
      slug: normalizeSlug(input.slug),
      title: input.title.trim(),
      summary: input.summary.trim(),
      publicPath: input.publicPath,
      featured: input.featured,

      workflowStatus: "DRAFT",
      publicationStatus: "NEVER_PUBLISHED",

      draftData: input.draftData,
      publishedData: null,

      draftVersion: 1,
      publishedVersion: null,
    });

    try {
      await Promise.all([
        ContentRevisionModel.create({
          entryId: entry._id,
          revisionNumber: 1,
          kind: "CREATED",
          snapshot: input.draftData,
          actorLogin: actor.githubLogin,
        }),

        AuditLogModel.create({
          action: "CREATE",
          actorLogin: actor.githubLogin,
          entityType: "ContentEntry",
          entityId: entry._id,
          description:
            `Created ${entry.type} draft: ${entry.title}`,
        }),
      ]);
    } catch (error) {
      await ContentEntryModel.deleteOne({
        _id: entry._id,
      });

      throw error;
    }

    return entry;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error(
        "An entry with this content type and slug already exists.",
      );
    }

    throw error;
  }
}

export async function saveDraft(
  id: string,
  expectedDraftVersion: number,
  input: ContentDraftInput,
  actor: Actor,
) {
  validateObjectId(id);
  await dbConnect();

  const existing = await ContentEntryModel.findById(id)
    .select({
      workflowStatus: 1,
      draftVersion: 1,
    })
    .lean();

  if (!existing) {
    throw new Error(
      "The content entry could not be found.",
    );
  }

  if (existing.workflowStatus === "ARCHIVED") {
    throw new Error(
      "Archived content must be restored before editing.",
    );
  }

  if (existing.draftVersion !== expectedDraftVersion) {
    throw new Error(
      "This entry changed after you opened it. Reload the page before saving.",
    );
  }

  try {
    const updated =
      await ContentEntryModel.findOneAndUpdate(
        {
          _id: id,
          draftVersion: expectedDraftVersion,
        },

        {
          $set: {
            type: input.type,
            slug: normalizeSlug(input.slug),
            title: input.title.trim(),
            summary: input.summary.trim(),
            publicPath: input.publicPath,
            featured: input.featured,
            draftData: input.draftData,
            workflowStatus: "DRAFT",
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
        "The draft changed before your save completed. Reload the page.",
      );
    }

    await Promise.all([
      ContentRevisionModel.create({
        entryId: updated._id,
        revisionNumber: updated.draftVersion,
        kind: "DRAFT_SAVED",
        snapshot: input.draftData,
        actorLogin: actor.githubLogin,
      }),

      AuditLogModel.create({
        action: "UPDATE",
        actorLogin: actor.githubLogin,
        entityType: "ContentEntry",
        entityId: updated._id,
        description:
          `Saved draft version ${updated.draftVersion}: ${updated.title}`,
      }),
    ]);

    return updated;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error(
        "Another entry already uses this content type and slug.",
      );
    }

    throw error;
  }
}

export async function publishEntry(
  id: string,
  expectedDraftVersion: number,
  actor: Actor,
) {
  validateObjectId(id);
  await dbConnect();

  const current = await ContentEntryModel.findById(id)
    .lean();

  if (!current) {
    throw new Error(
      "The content entry could not be found.",
    );
  }

  if (current.workflowStatus === "ARCHIVED") {
    throw new Error(
      "Archived content cannot be published.",
    );
  }

  if (current.draftVersion !== expectedDraftVersion) {
    throw new Error(
      "The draft changed before publication. Reload the page.",
    );
  }

  const publishedAt = new Date();

  const updated =
    await ContentEntryModel.findOneAndUpdate(
      {
        _id: id,
        draftVersion: expectedDraftVersion,
      },

      {
        $set: {
          publishedData: current.draftData,

          publishedVersion:
            current.draftVersion,

          publicationStatus: "PUBLISHED",
          workflowStatus: "SYNCED",

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
      "The content changed before publication completed.",
    );
  }

  const job = await PublishJobModel.create({
    entryId: updated._id,
    action: "PUBLISH",
    status: "PENDING",

    payload: {
      contentId: updated._id.toString(),
      type: updated.type,
      slug: updated.slug,
      publicPath: updated.publicPath,
      version: updated.publishedVersion,
      action: "PUBLISH",
    },
  });

  await Promise.all([
    ContentRevisionModel.create({
      entryId: updated._id,
      revisionNumber: current.draftVersion,
      kind: "PUBLISHED",
      snapshot: current.draftData,

      note:
        "Copied the working draft into the public snapshot.",

      actorLogin: actor.githubLogin,
    }),

    AuditLogModel.create({
      action: "PUBLISH",
      actorLogin: actor.githubLogin,
      entityType: "ContentEntry",
      entityId: updated._id,

      description:
        `Published ${updated.title} version ${updated.publishedVersion}`,
    }),
  ]);

  await processPublishJob(job._id.toString());

  return updated;
}

export async function unpublishEntry(
  id: string,
  actor: Actor,
) {
  validateObjectId(id);
  await dbConnect();

  const updated =
    await ContentEntryModel.findOneAndUpdate(
      {
        _id: id,
        publicationStatus: "PUBLISHED",
      },

      {
        $set: {
          publicationStatus: "UNPUBLISHED",
          workflowStatus: "DRAFT",
          unpublishedAt: new Date(),
        },
      },

      {
        new: true,
        runValidators: true,
      },
    );

  if (!updated) {
    throw new Error(
      "The published entry could not be found.",
    );
  }

  const job = await PublishJobModel.create({
    entryId: updated._id,
    action: "UNPUBLISH",
    status: "PENDING",

    payload: {
      contentId: updated._id.toString(),
      type: updated.type,
      slug: updated.slug,
      publicPath: updated.publicPath,
      version: updated.publishedVersion,
      action: "UNPUBLISH",
    },
  });

  await Promise.all([
    ContentRevisionModel.create({
      entryId: updated._id,
      revisionNumber: updated.draftVersion,
      kind: "UNPUBLISHED",
      snapshot: updated.draftData,

      note:
        "Removed the entry from the public snapshot API.",

      actorLogin: actor.githubLogin,
    }),

    AuditLogModel.create({
      action: "UNPUBLISH",
      actorLogin: actor.githubLogin,
      entityType: "ContentEntry",
      entityId: updated._id,

      description:
        `Unpublished ${updated.title}`,
    }),
  ]);

  await processPublishJob(job._id.toString());

  return updated;
}