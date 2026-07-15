import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Eye,
  FileText,
  Globe2,
  Inbox,
  MessageSquareText,
  Plus,
  RefreshCcw,
  Users,
} from "lucide-react";
import Link from "next/link";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";

import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";

import AnalyticsEventModel from "@/models/AnalyticsEvent";
import AuditLogModel from "@/models/AuditLog";
import ContactMessageModel from "@/models/ContactMessage";
import ContentEntryModel from "@/models/ContentEntry";
import PublishJobModel from "@/models/PublishJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContentTypeCount = {
  _id: string;
  count: number;
};

type DailyViewCount = {
  _id: string;
  count: number;
};

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function getActivityHref(
  entityType: string,
  entityId: string | null,
) {
  if (!entityId) {
    return null;
  }

  if (entityType === "ContentEntry") {
    return `/dashboard/content/${entityId}`;
  }

  if (entityType === "ContactMessage") {
    return `/dashboard/messages/${entityId}`;
  }

  if (entityType === "PublishJob") {
    return "/dashboard/publishing";
  }

  return null;
}

export default async function DashboardPage() {
  const session = await requireOwner();

  await dbConnect();

  const now = new Date();

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(
    thirtyDaysAgo.getDate() - 29,
  );
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(
    fourteenDaysAgo.getDate() - 13,
  );
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalContent,
    publishedContent,
    neverPublishedContent,
    unpublishedChanges,
    newMessages,
    failedJobs,
    pageViews,
    uniqueSessionHashes,
    contentByType,
    dailyViews,
    recentActivity,
    recentMessages,
    recentJobs,
  ] = await Promise.all([
    ContentEntryModel.countDocuments(),

    ContentEntryModel.countDocuments({
      publicationStatus: "PUBLISHED",
    }),

    ContentEntryModel.countDocuments({
      publicationStatus:
        "NEVER_PUBLISHED",
    }),

    ContentEntryModel.countDocuments({
      publicationStatus: "PUBLISHED",

      $expr: {
        $gt: [
          "$draftVersion",
          "$publishedVersion",
        ],
      },
    }),

    ContactMessageModel.countDocuments({
      status: "NEW",
    }),

    PublishJobModel.countDocuments({
      status: "FAILED",
    }),

    AnalyticsEventModel.countDocuments({
      eventName: "PAGE_VIEW",

      occurredAt: {
        $gte: thirtyDaysAgo,
      },
    }),

    AnalyticsEventModel.distinct(
      "sessionHash",
      {
        eventName: "PAGE_VIEW",

        occurredAt: {
          $gte: thirtyDaysAgo,
        },
      },
    ),

    ContentEntryModel.aggregate<ContentTypeCount>(
      [
        {
          $group: {
            _id: "$type",
            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
            _id: 1,
          },
        },
      ],
    ),

    AnalyticsEventModel.aggregate<DailyViewCount>(
      [
        {
          $match: {
            eventName: "PAGE_VIEW",

            occurredAt: {
              $gte: fourteenDaysAgo,
            },
          },
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$occurredAt",
              },
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ],
    ),

    AuditLogModel.find()
      .sort({
        createdAt: -1,
      })
      .limit(8)
      .lean(),

    ContactMessageModel.find()
      .sort({
        receivedAt: -1,
      })
      .limit(5)
      .lean(),

    PublishJobModel.find()
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .populate({
        path: "entryId",

        select: {
          title: 1,
          type: 1,
        },
      })
      .lean(),
  ]);

  const uniqueSessions =
    uniqueSessionHashes.length;

  const dailyViewMap = new Map(
    dailyViews.map((item) => [
      item._id,
      item.count,
    ]),
  );

  const trafficPoints = Array.from(
    {
      length: 14,
    },
    (_, index) => {
      const date = new Date(
        fourteenDaysAgo,
      );

      date.setDate(
        fourteenDaysAgo.getDate() +
          index,
      );

      const key = date
        .toISOString()
        .slice(0, 10);

      return {
        key,

        label:
          date.toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
            },
          ),

        count:
          dailyViewMap.get(key) ?? 0,
      };
    },
  );

  const maximumDailyViews = Math.max(
    ...trafficPoints.map(
      (point) => point.count,
    ),
    1,
  );

  const maximumTypeCount = Math.max(
    ...contentByType.map(
      (item) => item.count,
    ),
    1,
  );

  const attentionItems = [
    {
      label: "Failed publishing jobs",
      count: failedJobs,
      href: "/dashboard/publishing",
      icon: AlertTriangle,
      tone:
        failedJobs > 0
          ? "danger"
          : "neutral",
    },

    {
      label: "New messages",
      count: newMessages,
      href: "/dashboard/messages?status=NEW",
      icon: Inbox,
      tone:
        newMessages > 0
          ? "attention"
          : "neutral",
    },

    {
      label: "Drafts never published",
      count: neverPublishedContent,
      href:
        "/dashboard/content?publicationStatus=NEVER_PUBLISHED",
      icon: CircleDashed,
      tone:
        neverPublishedContent > 0
          ? "attention"
          : "neutral",
    },

    {
      label: "Published entries with private edits",
      count: unpublishedChanges,
      href: "/dashboard/content",
      icon: RefreshCcw,
      tone:
        unpublishedChanges > 0
          ? "attention"
          : "neutral",
    },
  ] as const;

  const metrics = [
    {
      label: "Total content",
      value: totalContent,
      description:
        `${publishedContent} publicly available`,
      href: "/dashboard/content",
      icon: FileText,
    },

    {
      label: "Page views",
      value: pageViews,
      description:
        "During the last 30 days",
      href: "/dashboard/analytics",
      icon: Eye,
    },

    {
      label: "Unique sessions",
      value: uniqueSessions,
      description:
        "Privacy-conscious session count",
      href: "/dashboard/analytics",
      icon: Users,
    },

    {
      label: "New messages",
      value: newMessages,
      description:
        newMessages === 1
          ? "One message needs review"
          : `${newMessages} messages need review`,
      href:
        "/dashboard/messages?status=NEW",
      icon: MessageSquareText,
    },
  ];

  const publicSiteUrl =
    process.env.PUBLIC_SITE_URL ??
    "https://nirajchaurasiya.com";

  return (
    <>
      <DashboardHeader
        title="Overview"
        description="The operational state of your public knowledge system."
        githubLogin={
          session.user.githubLogin
        }
      />

      <section className="overview-actions">
        <Link
          href="/dashboard/content/new"
          className="dashboard-primary-button"
        >
          <Plus size={16} />
          New content
        </Link>

        <a
          href={publicSiteUrl}
          target="_blank"
          rel="noreferrer"
          className="dashboard-secondary-button"
        >
          <Globe2 size={16} />
          Public site
        </a>
      </section>

      <section className="overview-metrics">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Link
              href={metric.href}
              key={metric.label}
            >
              <article>
                <Icon
                  size={19}
                  strokeWidth={1.7}
                />

                <strong>
                  {metric.value}
                </strong>

                <span>
                  {metric.label}
                </span>

                <p>
                  {metric.description}
                </p>

                <ArrowRight
                  size={16}
                />
              </article>
            </Link>
          );
        })}
      </section>

      <section className="overview-attention">
        <header>
          <div>
            <span>
              Operational attention
            </span>

            <h2>
              What needs review
            </h2>
          </div>

          {failedJobs === 0 &&
            newMessages === 0 &&
            unpublishedChanges ===
              0 && (
              <div className="overview-attention__healthy">
                <CheckCircle2
                  size={16}
                />

                System healthy
              </div>
            )}
        </header>

        <div className="overview-attention__list">
          {attentionItems.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className={`overview-attention__item overview-attention__item--${item.tone}`}
                >
                  <div>
                    <Icon
                      size={18}
                      strokeWidth={1.7}
                    />
                  </div>

                  <span>
                    <strong>
                      {item.count}
                    </strong>

                    <small>
                      {item.label}
                    </small>
                  </span>

                  <ArrowRight
                    size={16}
                  />
                </Link>
              );
            },
          )}
        </div>
      </section>

      <section className="overview-main-grid">
        <article className="overview-panel overview-traffic">
          <header>
            <div>
              <span>
                Public traffic
              </span>

              <h2>
                Last 14 days
              </h2>
            </div>

            <Link href="/dashboard/analytics">
              Full analytics
              <ArrowRight size={15} />
            </Link>
          </header>

          <div className="overview-traffic-chart">
            {trafficPoints.map(
              (point) => {
                const height =
                  point.count === 0
                    ? 2
                    : Math.max(
                        8,
                        Math.round(
                          (point.count /
                            maximumDailyViews) *
                            100,
                        ),
                      );

                return (
                  <article
                    key={point.key}
                    title={`${point.label}: ${point.count} page views`}
                  >
                    <strong>
                      {point.count}
                    </strong>

                    <div>
                      <span
                        style={{
                          height:
                            `${height}%`,
                        }}
                      />
                    </div>

                    <small>
                      {point.label}
                    </small>
                  </article>
                );
              },
            )}
          </div>
        </article>

        <article className="overview-panel">
          <header>
            <div>
              <span>
                Knowledge system
              </span>

              <h2>
                Content distribution
              </h2>
            </div>

            <BarChart3
              size={20}
              strokeWidth={1.6}
            />
          </header>

          <div className="overview-content-types">
            {contentByType.map(
              (item, index) => (
                <article key={item._id}>
                  <span>
                    {String(
                      index + 1,
                    ).padStart(2, "0")}
                  </span>

                  <div>
                    <strong>
                      {formatLabel(
                        item._id,
                      )}
                    </strong>

                    <div>
                      <span
                        style={{
                          width:
                            `${Math.max(
                              5,
                              Math.round(
                                (item.count /
                                  maximumTypeCount) *
                                  100,
                              ),
                            )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <b>{item.count}</b>
                </article>
              ),
            )}

            {contentByType.length ===
              0 && (
              <div className="overview-empty">
                No content entries yet.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="overview-secondary-grid">
        <article className="overview-panel">
          <header>
            <div>
              <span>
                Recent operations
              </span>

              <h2>
                Activity
              </h2>
            </div>

            <Link href="/dashboard/activity">
              View all
              <ArrowRight size={15} />
            </Link>
          </header>

          <div className="overview-activity-list">
            {recentActivity.map(
              (activity) => {
                const entityId =
                  activity.entityId
                    ? activity.entityId.toString()
                    : null;

                const href =
                  getActivityHref(
                    activity.entityType,
                    entityId,
                  );

                const content = (
                  <>
                    <div>
                      <Clock3
                        size={15}
                      />
                    </div>

                    <span>
                      <small>
                        {formatLabel(
                          activity.action,
                        )}{" "}
                        ·{" "}
                        {formatLabel(
                          activity.entityType,
                        )}
                      </small>

                      <strong>
                        {
                          activity.description
                        }
                      </strong>

                      <time>
                        @
                        {
                          activity.actorLogin
                        }{" "}
                        ·{" "}
                        {formatDate(
                          activity.createdAt,
                        )}
                      </time>
                    </span>

                    {href && (
                      <ArrowRight
                        size={15}
                      />
                    )}
                  </>
                );

                return href ? (
                  <Link
                    href={href}
                    key={
                      activity._id.toString()
                    }
                  >
                    {content}
                  </Link>
                ) : (
                  <article
                    key={
                      activity._id.toString()
                    }
                  >
                    {content}
                  </article>
                );
              },
            )}

            {recentActivity.length ===
              0 && (
              <div className="overview-empty">
                No operational activity
                recorded.
              </div>
            )}
          </div>
        </article>

        <article className="overview-panel">
          <header>
            <div>
              <span>
                Communication
              </span>

              <h2>
                Latest messages
              </h2>
            </div>

            <Link href="/dashboard/messages">
              Inbox
              <ArrowRight size={15} />
            </Link>
          </header>

          <div className="overview-message-list">
            {recentMessages.map(
              (message) => (
                <Link
                  href={`/dashboard/messages/${message._id.toString()}`}
                  key={
                    message._id.toString()
                  }
                >
                  <div>
                    {message.name
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <span>
                    <small>
                      {message.name} ·{" "}
                      {message.reason}
                    </small>

                    <strong>
                      {message.subject}
                    </strong>

                    <time>
                      {formatDate(
                        message.receivedAt,
                      )}
                    </time>
                  </span>

                  <StatusBadge
                    value={
                      message.status
                    }
                  />
                </Link>
              ),
            )}

            {recentMessages.length ===
              0 && (
              <div className="overview-empty">
                No contact messages yet.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="overview-panel overview-publishing">
        <header>
          <div>
            <span>
              Publication pipeline
            </span>

            <h2>
              Recent publishing jobs
            </h2>
          </div>

          <Link href="/dashboard/publishing">
            Publishing operations
            <ArrowRight size={15} />
          </Link>
        </header>

        <div className="overview-publishing-list">
          {recentJobs.map((job) => {
            const populatedEntry =
              typeof job.entryId ===
                "object" &&
              job.entryId !== null &&
              "title" in job.entryId
                ? (job.entryId as {
                    title?: string;
                    type?: string;
                  })
                : null;

            return (
              <article
                key={job._id.toString()}
              >
                <div>
                  <Globe2
                    size={17}
                    strokeWidth={1.7}
                  />
                </div>

                <span>
                  <small>
                    {job.action}
                  </small>

                  <strong>
                    {populatedEntry?.title ??
                      "Complete public system"}
                  </strong>

                  <time>
                    {formatDate(
                      job.createdAt,
                    )}
                  </time>
                </span>

                <b>
                  {job.attemptCount}{" "}
                  {job.attemptCount === 1
                    ? "attempt"
                    : "attempts"}
                </b>

                <StatusBadge
                  value={job.status}
                />
              </article>
            );
          })}

          {recentJobs.length === 0 && (
            <div className="overview-empty">
              No publishing jobs yet.
            </div>
          )}
        </div>
      </section>
    </>
  );
}