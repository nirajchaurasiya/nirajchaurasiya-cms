import Link from "next/link";
import { notFound } from "next/navigation";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";

import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";

import ContentEntryModel from "@/models/ContentEntry";

import type { ContentType } from "@/types/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SectionConfiguration = {
  type: ContentType;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
};

const contentSections = {
  books: {
    type: "BOOK",
    title: "Books",
    description:
      "Manage books, intellectual conversations, reading threads, open questions, and dated reflections.",
    emptyTitle: "No book conversations exist yet.",
    emptyDescription:
      "Create a Book entry to begin documenting an intellectual conversation.",
  },

  projects: {
    type: "PROJECT",
    title: "Projects",
    description:
      "Manage software, engineering, research-driven products, and evolving systems.",
    emptyTitle: "No projects exist yet.",
    emptyDescription: "Create a Project entry to begin documenting a system.",
  },

  research: {
    type: "RESEARCH",
    title: "Research",
    description:
      "Manage research questions, methods, claims, evidence, limitations, and open uncertainty.",
    emptyTitle: "No research entries exist yet.",
    emptyDescription:
      "Create a Research entry to begin documenting an investigation.",
  },

  frameworks: {
    type: "FRAMEWORK",
    title: "Frameworks",
    description:
      "Manage reasoning frameworks, components, versions, applications, and limitations.",
    emptyTitle: "No frameworks exist yet.",
    emptyDescription: "Create a Framework entry to publish a reasoning system.",
  },

  writing: {
    type: "WRITING",
    title: "Writing",
    description:
      "Manage essays, reflections, research notes, technical explanations, and building notes.",
    emptyTitle: "No writing entries exist yet.",
    emptyDescription:
      "Create a Writing entry to begin publishing an essay or reflection.",
  },

  media: {
    type: "MEDIA",
    title: "Media",
    description:
      "Manage videos, playlists, presentations, talks, interviews, and media series.",
    emptyTitle: "No media entries exist yet.",
    emptyDescription:
      "Create a Media entry to document a video, talk, or series.",
  },

  timeline: {
    type: "TIMELINE",
    title: "Timeline",
    description:
      "Manage launches, publications, versions, presentations, and meaningful system changes.",
    emptyTitle: "No timeline events exist yet.",
    emptyDescription:
      "Create a Timeline entry to preserve an important milestone.",
  },

  archive: {
    type: "ARCHIVE",
    title: "Archive",
    description:
      "Manage deprecated systems, previous versions, completed experiments, and preserved lessons.",
    emptyTitle: "No archive entries exist yet.",
    emptyDescription:
      "Create an Archive entry to preserve an earlier system or experiment.",
  },
} satisfies Record<string, SectionConfiguration>;

type PageProps = {
  params: Promise<{
    section: string;
  }>;
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DashboardContentSectionPage({
  params,
}: PageProps) {
  const session = await requireOwner();

  const { section } = await params;

  const configuration =
    contentSections[section as keyof typeof contentSections];

  if (!configuration) {
    notFound();
  }

  await dbConnect();

  const entries = await ContentEntryModel.find({
    type: configuration.type,
  })
    .sort({
      featured: -1,
      updatedAt: -1,
    })
    .lean();

  const publishedCount = entries.filter(
    (entry) => entry.publicationStatus === "PUBLISHED",
  ).length;

  const privateCount = entries.length - publishedCount;

  return (
    <>
      <DashboardHeader
        title={configuration.title}
        description={configuration.description}
        githubLogin={session.user.githubLogin}
      />

      <section className="dashboard-content-index">
        <header className="dashboard-content-index__summary">
          <div>
            <strong>{entries.length}</strong>

            <span>{entries.length === 1 ? "entry" : "entries"}</span>
          </div>

          <div className="dashboard-content-index__counts">
            <span>{publishedCount} published</span>

            <span>{privateCount} private or unpublished</span>
          </div>
        </header>

        <div className="dashboard-content-list">
          {entries.map((entry) => {
            const hasUnpublishedChanges =
              entry.publicationStatus === "PUBLISHED" &&
              typeof entry.publishedVersion === "number" &&
              entry.draftVersion > entry.publishedVersion;

            return (
              <Link
                href={`/dashboard/content/${entry._id.toString()}`}
                className="dashboard-content-row dashboard-content-row--link"
                key={entry._id.toString()}
              >
                <div className="dashboard-content-row__content">
                  <div className="dashboard-content-row__eyebrow">
                    <small>{entry.type}</small>

                    {entry.featured && <span>Featured</span>}
                  </div>

                  <h2>{entry.title}</h2>

                  <p>{entry.summary}</p>

                  <div className="dashboard-content-row__dates">
                    <span>Updated {formatDate(entry.updatedAt)}</span>

                    {entry.publicPath && <span>{entry.publicPath}</span>}
                  </div>
                </div>

                <div className="dashboard-content-row__state">
                  <StatusBadge value={entry.workflowStatus} />

                  <StatusBadge value={entry.publicationStatus} />

                  <span>Draft v{entry.draftVersion}</span>

                  <span>
                    Public{" "}
                    {typeof entry.publishedVersion === "number"
                      ? `v${entry.publishedVersion}`
                      : "none"}
                  </span>

                  {hasUnpublishedChanges && (
                    <strong>Unpublished changes</strong>
                  )}
                </div>
              </Link>
            );
          })}

          {entries.length === 0 && (
            <div className="dashboard-empty-state">
              <h2>{configuration.emptyTitle}</h2>

              <p>{configuration.emptyDescription}</p>

              <Link
                href="/dashboard/content/new"
                className="dashboard-empty-state__action"
              >
                Create new content
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
