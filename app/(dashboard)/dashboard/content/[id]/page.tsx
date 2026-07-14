import {
  isValidObjectId,
} from "mongoose";
import { notFound } from "next/navigation";

import ContentEditorForm from "@/components/dashboard/ContentEditorForm";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PublicationControls from "@/components/dashboard/PublicationControls";
import RelationshipManager from "@/components/dashboard/RelationshipManager";
import StatusBadge from "@/components/dashboard/StatusBadge";

import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";

import ContentEntryModel from "@/models/ContentEntry";
import ContentRelationModel from "@/models/ContentRelation";
import ContentRevisionModel from "@/models/ContentRevision";

import type {
  JsonObject,
  RelationKind,
} from "@/types/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function serializeJsonObject(
  value: unknown,
): JsonObject {
  return JSON.parse(
    JSON.stringify(value ?? {}),
  ) as JsonObject;
}

export default async function ContentEditorPage({
  params,
}: PageProps) {
  const session =
    await requireOwner();

  const { id } = await params;

  if (!isValidObjectId(id)) {
    notFound();
  }

  await dbConnect();

  const [
    entry,
    revisions,
    candidates,
    relationships,
  ] = await Promise.all([
    ContentEntryModel.findById(id)
      .lean(),

    ContentRevisionModel.find({
      entryId: id,
    })
      .sort({
        createdAt: -1,
      })
      .limit(12)
      .lean(),

    ContentEntryModel.find({
      _id: {
        $ne: id,
      },
    })
      .select({
        title: 1,
        type: 1,
        slug: 1,
        publicationStatus: 1,
      })
      .sort({
        type: 1,
        title: 1,
      })
      .lean(),

    ContentRelationModel.find({
      sourceId: id,
    })
      .sort({
        sortOrder: 1,
        createdAt: 1,
      })
      .lean(),
  ]);

  if (!entry) {
    notFound();
  }

  const currentDraftVersion =
    typeof entry.draftVersion ===
      "number" &&
    Number.isInteger(
      entry.draftVersion,
    ) &&
    entry.draftVersion > 0
      ? entry.draftVersion
      : 1;

  const currentPublishedVersion =
    typeof entry.publishedVersion ===
    "number"
      ? entry.publishedVersion
      : null;

  return (
    <>
      <DashboardHeader
        title={entry.title}
        description={`${entry.type} · Working draft version ${currentDraftVersion}`}
        githubLogin={
          session.user.githubLogin
        }
      />

      <section className="dashboard-editor-state">
        <StatusBadge
          value={
            entry.workflowStatus
          }
        />

        <StatusBadge
          value={
            entry.publicationStatus
          }
        />

        <span>
          Public version:{" "}
          {currentPublishedVersion
            ? `v${currentPublishedVersion}`
            : "None"}
        </span>
      </section>

      <ContentEditorForm
        mode="edit"
        initialEntry={{
          id,
          type: entry.type,
          slug: entry.slug,
          title: entry.title,
          summary: entry.summary,

          publicPath:
            entry.publicPath ?? "",

          featured:
            entry.featured ?? false,

          draftVersion:
            currentDraftVersion,

          draftData:
            serializeJsonObject(
              entry.draftData,
            ),
        }}
      />

      <PublicationControls
        id={id}
        draftVersion={
          currentDraftVersion
        }
        publishedVersion={
          currentPublishedVersion
        }
        publicationStatus={
          entry.publicationStatus
        }
      />

      <RelationshipManager
        sourceId={id}
        candidates={candidates.map(
          (candidate) => ({
            id:
              candidate._id.toString(),

            title:
              candidate.title,

            type:
              candidate.type,

            slug:
              candidate.slug,

            publicationStatus:
              candidate.publicationStatus,
          }),
        )}
        relationships={relationships.map(
          (relationship) => ({
            id:
              relationship._id.toString(),

            targetId:
              relationship.targetId.toString(),

            relationKind:
              relationship.relationKind as RelationKind,

            description:
              relationship.description ??
              null,

            sortOrder:
              relationship.sortOrder,
          }),
        )}
      />

      <section className="revision-panel">
        <header>
          <span>
            Revision history
          </span>

          <h2>
            Recorded changes
          </h2>
        </header>

        <div className="revision-list">
          {revisions.map(
            (revision) => (
              <article
                key={
                  revision._id.toString()
                }
              >
                <span>
                  v
                  {
                    revision.revisionNumber
                  }
                </span>

                <div>
                  <strong>
                    {revision.kind}
                  </strong>

                  <small>
                    @
                    {
                      revision.actorLogin
                    }
                  </small>
                </div>

                <time>
                  {new Date(
                    revision.createdAt,
                  ).toLocaleString(
                    "en-US",
                  )}
                </time>
              </article>
            ),
          )}
        </div>
      </section>
    </>
  );
}