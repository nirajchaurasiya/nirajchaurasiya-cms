import {
  CheckCircle2,
  CircleDashed,
  CircleX,
  LoaderCircle,
} from "lucide-react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  FullSyncControl,
  RetryJobControl,
} from "@/components/dashboard/PublishingActions";
import StatusBadge from "@/components/dashboard/StatusBadge";

import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";

import PublishJobModel from "@/models/PublishJob";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type PopulatedEntry = {
  _id: {
    toString(): string;
  };

  title?: string;
  type?: string;
  slug?: string;
};

function formatDate(
  value: Date | string | null,
) {
  if (!value) {
    return "Not completed";
  }

  return new Date(
    value,
  ).toLocaleString("en-US");
}

function readEntry(
  value: unknown,
): PopulatedEntry | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  return value as PopulatedEntry;
}

function readPayloadLabel(
  value: unknown,
) {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const version =
    Reflect.get(
      value,
      "version",
    );

  return typeof version ===
    "number"
    ? `v${version}`
    : null;
}

export default async function PublishingPage() {
  const session =
    await requireOwner();

  await dbConnect();

  const jobs =
    await PublishJobModel.find()
      .sort({
        createdAt: -1,
      })
      .limit(100)
      .populate({
        path: "entryId",

        select: {
          title: 1,
          type: 1,
          slug: 1,
        },
      })
      .lean();

  const counts = {
    pending:
      jobs.filter(
        (job) =>
          job.status ===
          "PENDING",
      ).length,

    running:
      jobs.filter(
        (job) =>
          job.status ===
          "RUNNING",
      ).length,

    succeeded:
      jobs.filter(
        (job) =>
          job.status ===
          "SUCCEEDED",
      ).length,

    failed:
      jobs.filter(
        (job) =>
          job.status ===
          "FAILED",
      ).length,
  };

  const metrics = [
    {
      label: "Pending",
      value: counts.pending,
      icon: CircleDashed,
    },
    {
      label: "Running",
      value: counts.running,
      icon: LoaderCircle,
    },
    {
      label: "Succeeded",
      value: counts.succeeded,
      icon: CheckCircle2,
    },
    {
      label: "Failed",
      value: counts.failed,
      icon: CircleX,
    },
  ];

  return (
    <>
      <DashboardHeader
        title="Publishing"
        description="Inspect publication jobs, retry failures, and synchronize the complete public knowledge system."
        githubLogin={
          session.user.githubLogin
        }
      />

      <section className="publishing-summary">
        <div className="publishing-summary__metrics">
          {metrics.map(
            (metric) => {
              const Icon =
                metric.icon;

              return (
                <article
                  key={
                    metric.label
                  }
                >
                  <Icon
                    size={18}
                    strokeWidth={1.7}
                  />

                  <strong>
                    {metric.value}
                  </strong>

                  <span>
                    {metric.label}
                  </span>
                </article>
              );
            },
          )}
        </div>

        <article className="publishing-sync-panel">
          <div>
            <span>
              Full synchronization
            </span>

            <h2>
              Refresh the complete public content system
            </h2>

            <p>
              This creates a full-sync
              publishing job rather than
              modifying any draft or
              published snapshot.
            </p>
          </div>

          <FullSyncControl />
        </article>
      </section>

      <section className="publishing-history">
        <header>
          <div>
            <span>
              Operational history
            </span>

            <h2>
              Publishing jobs
            </h2>
          </div>

          <strong>
            {jobs.length}{" "}
            {jobs.length === 1
              ? "job"
              : "jobs"}
          </strong>
        </header>

        <div className="publishing-job-list">
          {jobs.map((job) => {
            const entry =
              readEntry(
                job.entryId,
              );

            const version =
              readPayloadLabel(
                job.payload,
              );

            return (
              <article
                key={
                  job._id.toString()
                }
                className="publishing-job"
              >
                <div className="publishing-job__identity">
                  <small>
                    {job.action}
                  </small>

                  <strong>
                    {entry?.title ??
                      "Complete public system"}
                  </strong>

                  <p>
                    {entry
                      ? `${entry.type ?? "CONTENT"} · ${entry.slug ?? ""}`
                      : "System-level operation"}
                  </p>
                </div>

                <div className="publishing-job__version">
                  <span>
                    Version
                  </span>

                  <strong>
                    {version ?? "—"}
                  </strong>
                </div>

                <div className="publishing-job__attempts">
                  <span>
                    Attempts
                  </span>

                  <strong>
                    {
                      job.attemptCount
                    }
                  </strong>
                </div>

                <div className="publishing-job__time">
                  <span>
                    Created
                  </span>

                  <strong>
                    {formatDate(
                      job.createdAt,
                    )}
                  </strong>

                  <small>
                    Completed:{" "}
                    {formatDate(
                      job.completedAt,
                    )}
                  </small>
                </div>

                <div className="publishing-job__status">
                  <StatusBadge
                    value={
                      job.status
                    }
                  />

                  {job.errorMessage && (
                    <p>
                      {
                        job.errorMessage
                      }
                    </p>
                  )}
                </div>

                <div className="publishing-job__action">
                  {[
                    "FAILED",
                    "PENDING",
                  ].includes(
                    job.status,
                  ) && (
                    <RetryJobControl
                      jobId={
                        job._id.toString()
                      }
                    />
                  )}
                </div>
              </article>
            );
          })}

          {jobs.length === 0 && (
            <div className="publishing-empty">
              <CircleDashed
                size={26}
                strokeWidth={1.5}
              />

              <h3>
                No publishing jobs yet.
              </h3>

              <p>
                Publishing or unpublishing
                the first entry will create
                an operational record here.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}