import {
  FileEdit,
  Globe2,
  Inbox,
  UploadCloud,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";
import ContactMessageModel from "@/models/ContactMessage";
import ContentEntryModel from "@/models/ContentEntry";
import PublishJobModel from "@/models/PublishJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireOwner();

  await dbConnect();

  const [
    totalContent,
    activeDrafts,
    publishedContent,
    newMessages,
    pendingJobs,
  ] = await Promise.all([
    ContentEntryModel.countDocuments(),

    ContentEntryModel.countDocuments({
      workflowStatus: {
        $in: [
          "DRAFT",
          "REVIEW",
          "READY",
        ],
      },
    }),

    ContentEntryModel.countDocuments({
      publicationStatus: "PUBLISHED",
    }),

    ContactMessageModel.countDocuments({
      status: "NEW",
    }),

    PublishJobModel.countDocuments({
      status: {
        $in: [
          "PENDING",
          "RUNNING",
        ],
      },
    }),
  ]);

  const metrics = [
    {
      label: "Content entries",
      value: totalContent,
      icon: FileEdit,
    },
    {
      label: "Active drafts",
      value: activeDrafts,
      icon: FileEdit,
    },
    {
      label: "Published entries",
      value: publishedContent,
      icon: Globe2,
    },
    {
      label: "New messages",
      value: newMessages,
      icon: Inbox,
    },
    {
      label: "Publishing jobs",
      value: pendingJobs,
      icon: UploadCloud,
    },
  ];

  return (
    <>
      <DashboardHeader
        title="Control Center"
        description="Manage the public knowledge system, publication state, messages, and analytics."
        githubLogin={
          session.user.githubLogin
        }
      />

      <section className="dashboard-metric-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article key={metric.label}>
              <Icon
                size={19}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          );
        })}
      </section>

      <section className="dashboard-foundation-panel">
        <span>Foundation state</span>

        <h2>
          MongoDB and owner authentication are connected.
        </h2>

        <p>
          The next phase adds visual content editors,
          revision creation, relationships, and the
          explicit draft-to-published-snapshot workflow.
        </p>
      </section>
    </>
  );
}