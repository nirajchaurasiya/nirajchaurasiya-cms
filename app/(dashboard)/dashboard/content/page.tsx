import Link from "next/link";
import {
  ArrowUpRight,
  Plus,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";
import ContentEntryModel from "@/models/ContentEntry";
import {
  contentTypes,
  type ContentType,
} from "@/types/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    type?: string;
  }>;
};

export default async function ContentPage({
  searchParams,
}: PageProps) {
  const session = await requireOwner();
  const { type } = await searchParams;

  const selectedType =
    contentTypes.includes(
      type as ContentType,
    )
      ? (type as ContentType)
      : null;

  await dbConnect();

  const entries =
    await ContentEntryModel.find(
      selectedType
        ? {
            type: selectedType,
          }
        : {},
    )
      .sort({
        updatedAt: -1,
      })
      .lean();

  return (
    <>
      <DashboardHeader
        title={
          selectedType
            ? `${selectedType.toLowerCase()} content`
            : "All Content"
        }
        description="Manage private drafts, revisions, and published snapshots."
        githubLogin={
          session.user.githubLogin
        }
      />

      <section className="dashboard-content-index">
        <header>
          <div>
            <strong>{entries.length}</strong>

            <span>
              {entries.length === 1
                ? "entry"
                : "entries"}
            </span>
          </div>

          <Link
            href="/dashboard/content/new"
            className="dashboard-primary-button"
          >
            <Plus size={16} />
            New content
          </Link>
        </header>

        <div className="dashboard-content-list">
          {entries.map((entry) => (
            <Link
              href={`/dashboard/content/${entry._id.toString()}`}
              className="dashboard-content-row"
              key={entry._id.toString()}
            >
              <div>
                <small>{entry.type}</small>

                <h2>{entry.title}</h2>

                <p>{entry.summary}</p>
              </div>

              <div>
                <StatusBadge
                  value={entry.workflowStatus}
                />

                <StatusBadge
                  value={entry.publicationStatus}
                />

                <span>
                  Draft v{entry.draftVersion}
                </span>

                <ArrowUpRight size={17} />
              </div>
            </Link>
          ))}

          {entries.length === 0 && (
            <div className="dashboard-empty-state">
              <h2>No content exists yet.</h2>

              <p>
                Create the first private MongoDB
                draft.
              </p>

              <Link
                href="/dashboard/content/new"
                className="dashboard-primary-button"
              >
                <Plus size={16} />
                Create content
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}