import Link from "next/link";
import {
  ArrowUpRight,
  Eye,
  Laptop,
  MousePointerClick,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";

import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";

import AnalyticsEventModel from "@/models/AnalyticsEvent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supportedRanges = [
  7,
  30,
  90,
] as const;

type PageProps = {
  searchParams: Promise<{
    range?: string;
  }>;
};

type DailyPoint = {
  date: string;
  label: string;
  count: number;
};

function formatPath(
  path: string | null,
) {
  return path || "Unknown path";
}

function readDomain(
  value: string | null,
) {
  if (!value) {
    return "Direct";
  }

  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

export default async function AnalyticsPage({
  searchParams,
}: PageProps) {
  const session =
    await requireOwner();

  const parameters =
    await searchParams;

  const requestedRange =
    Number(
      parameters.range,
    );

  const range =
    supportedRanges.includes(
      requestedRange as
        (typeof supportedRanges)[number],
    )
      ? requestedRange
      : 30;

  const startDate =
    new Date();

  startDate.setHours(
    0,
    0,
    0,
    0,
  );

  startDate.setDate(
    startDate.getDate() -
      (range - 1),
  );

  await dbConnect();

  const events =
    await AnalyticsEventModel.find({
      occurredAt: {
        $gte: startDate,
      },
    })
      .select({
        eventName: 1,
        path: 1,
        targetUrl: 1,
        referrer: 1,
        sessionHash: 1,
        country: 1,
        deviceType: 1,
        occurredAt: 1,
      })
      .sort({
        occurredAt: 1,
      })
      .lean();

  const pageViews =
    events.filter(
      (event) =>
        event.eventName ===
        "PAGE_VIEW",
    );

  const externalClicks =
    events.filter(
      (event) =>
        event.eventName ===
        "EXTERNAL_CLICK",
    );

  const uniqueVisitors =
    new Set(
      pageViews.map(
        (event) =>
          event.sessionHash,
      ),
    ).size;

  const pathCounts =
    new Map<string, number>();

  const referrerCounts =
    new Map<string, number>();

  const deviceCounts =
    new Map<string, number>();

  const countryCounts =
    new Map<string, number>();

  const dailyCounts =
    new Map<string, number>();

  for (
    const event of pageViews
  ) {
    const path =
      formatPath(event.path);

    pathCounts.set(
      path,
      (pathCounts.get(path) ?? 0) +
        1,
    );

    const referrer =
      readDomain(
        event.referrer,
      );

    referrerCounts.set(
      referrer,
      (referrerCounts.get(
        referrer,
      ) ?? 0) + 1,
    );

    deviceCounts.set(
      event.deviceType,
      (deviceCounts.get(
        event.deviceType,
      ) ?? 0) + 1,
    );

    const country =
      event.country ||
      "Unknown";

    countryCounts.set(
      country,
      (countryCounts.get(
        country,
      ) ?? 0) + 1,
    );

    const dateKey =
      new Date(
        event.occurredAt,
      )
        .toISOString()
        .slice(0, 10);

    dailyCounts.set(
      dateKey,
      (dailyCounts.get(
        dateKey,
      ) ?? 0) + 1,
    );
  }

  const dailyPoints:
    DailyPoint[] = [];

  for (
    let offset = 0;
    offset < range;
    offset += 1
  ) {
    const date =
      new Date(startDate);

    date.setDate(
      startDate.getDate() +
        offset,
    );

    const dateKey =
      date
        .toISOString()
        .slice(0, 10);

    dailyPoints.push({
      date: dateKey,

      label:
        date.toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          },
        ),

      count:
        dailyCounts.get(
          dateKey,
        ) ?? 0,
    });
  }

  const maximumDailyViews =
    Math.max(
      ...dailyPoints.map(
        (point) =>
          point.count,
      ),
      1,
    );

  const topPages =
    [...pathCounts.entries()]
      .sort(
        (left, right) =>
          right[1] - left[1],
      )
      .slice(0, 10);

  const topReferrers =
    [...referrerCounts.entries()]
      .sort(
        (left, right) =>
          right[1] - left[1],
      )
      .slice(0, 8);

  const topCountries =
    [...countryCounts.entries()]
      .sort(
        (left, right) =>
          right[1] - left[1],
      )
      .slice(0, 8);

  const metrics = [
    {
      label: "Page views",
      value: pageViews.length,
      icon: Eye,
    },
    {
      label: "Unique sessions",
      value: uniqueVisitors,
      icon: Users,
    },
    {
      label: "External clicks",
      value:
        externalClicks.length,
      icon:
        MousePointerClick,
    },
    {
      label: "Views per session",
      value:
        uniqueVisitors > 0
          ? (
              pageViews.length /
              uniqueVisitors
            ).toFixed(1)
          : "0.0",
      icon: ArrowUpRight,
    },
  ];

  const deviceItems = [
    {
      label: "Desktop",
      key: "desktop",
      icon: Laptop,
    },
    {
      label: "Mobile",
      key: "mobile",
      icon: Smartphone,
    },
    {
      label: "Tablet",
      key: "tablet",
      icon: Tablet,
    },
  ];

  return (
    <>
      <DashboardHeader
        title="Analytics"
        description="Privacy-conscious traffic and interaction data from the public knowledge system."
        githubLogin={
          session.user.githubLogin
        }
      />

      <section className="analytics-range-selector">
        <span>
          Reporting period
        </span>

        <div>
          {supportedRanges.map(
            (days) => (
              <Link
                href={`/dashboard/analytics?range=${days}`}
                key={days}
                className={
                  range === days
                    ? "analytics-range analytics-range--active"
                    : "analytics-range"
                }
              >
                {days} days
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="analytics-metrics">
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
                  size={19}
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
      </section>

      <section className="analytics-chart-panel">
        <header>
          <span>
            Traffic over time
          </span>

          <h2>
            Daily page views
          </h2>
        </header>

        <div className="analytics-bar-chart">
          {dailyPoints.map(
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
                  key={
                    point.date
                  }
                  title={`${point.label}: ${point.count} views`}
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
      </section>

      <section className="analytics-grid">
        <AnalyticsList
          eyebrow="Content"
          title="Most viewed pages"
          entries={topPages}
          emptyMessage="No page views recorded."
        />

        <AnalyticsList
          eyebrow="Acquisition"
          title="Top referrers"
          entries={topReferrers}
          emptyMessage="No referrer data recorded."
        />

        <article className="analytics-panel">
          <header>
            <span>Devices</span>
            <h2>Visitor devices</h2>
          </header>

          <div className="analytics-device-list">
            {deviceItems.map(
              (item) => {
                const Icon =
                  item.icon;

                const count =
                  deviceCounts.get(
                    item.key,
                  ) ?? 0;

                const percentage =
                  pageViews.length > 0
                    ? Math.round(
                        (count /
                          pageViews.length) *
                          100,
                      )
                    : 0;

                return (
                  <article
                    key={
                      item.key
                    }
                  >
                    <Icon
                      size={18}
                    />

                    <span>
                      <strong>
                        {
                          item.label
                        }
                      </strong>

                      <small>
                        {percentage}%
                      </small>
                    </span>

                    <b>{count}</b>
                  </article>
                );
              },
            )}
          </div>
        </article>

        <AnalyticsList
          eyebrow="Location"
          title="Top countries"
          entries={topCountries}
          emptyMessage="No country information recorded."
        />
      </section>
    </>
  );
}

function AnalyticsList({
  eyebrow,
  title,
  entries,
  emptyMessage,
}: {
  eyebrow: string;
  title: string;
  entries: Array<
    [string, number]
  >;
  emptyMessage: string;
}) {
  const maximum =
    Math.max(
      ...entries.map(
        (entry) =>
          entry[1],
      ),
      1,
    );

  return (
    <article className="analytics-panel">
      <header>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </header>

      <div className="analytics-ranked-list">
        {entries.map(
          (
            [label, count],
            index,
          ) => (
            <article
              key={label}
            >
              <span>
                {String(
                  index + 1,
                ).padStart(
                  2,
                  "0",
                )}
              </span>

              <div>
                <strong>
                  {label}
                </strong>

                <div>
                  <span
                    style={{
                      width:
                        `${Math.max(
                          3,
                          Math.round(
                            (count /
                              maximum) *
                              100,
                          ),
                        )}%`,
                    }}
                  />
                </div>
              </div>

              <b>{count}</b>
            </article>
          ),
        )}

        {entries.length === 0 && (
          <p className="analytics-empty">
            {emptyMessage}
          </p>
        )}
      </div>
    </article>
  );
}