import {
  Archive,
  ArrowUpRight,
  CirclePlus,
  FilePenLine,
  Filter,
  GitBranch,
  Globe2,
  Inbox,
  LogIn,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  Undo2,
} from "lucide-react";
import Link from "next/link";

import DashboardHeader from "@/components/dashboard/DashboardHeader";

import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";

import AuditLogModel from "@/models/AuditLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supportedRanges = [
  7,
  30,
  90,
  365,
] as const;

type ActivityRange =
  (typeof supportedRanges)[number];

type PageProps = {
  searchParams: Promise<{
    q?: string;
    action?: string;
    entity?: string;
    actor?: string;
    range?: string;
  }>;
};

function escapeRegularExpression(
  value: string,
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

function formatLabel(
  value: string,
) {
  return value
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatTime(
  value: Date | string,
) {
  return new Date(value).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function formatDay(
  value: Date | string,
) {
  const date = new Date(value);

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(
    yesterday.getDate() - 1,
  );

  const dateKey =
    date.toDateString();

  if (
    dateKey ===
    today.toDateString()
  ) {
    return "Today";
  }

  if (
    dateKey ===
    yesterday.toDateString()
  ) {
    return "Yesterday";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );
}

function getActivityHref(
  entityType: string,
  entityId: string | null,
) {
  if (
    !entityId
  ) {
    return null;
  }

  if (
    entityType ===
    "ContentEntry"
  ) {
    return `/dashboard/content/${entityId}`;
  }

  if (
    entityType ===
    "ContactMessage"
  ) {
    return `/dashboard/messages/${entityId}`;
  }

  if (
    entityType ===
    "PublishJob"
  ) {
    return "/dashboard/publishing";
  }

  return null;
}

function ActivityIcon({
  action,
  entityType,
}: {
  action: string;
  entityType: string;
}) {
  const normalized =
    action.toUpperCase();

  if (
    normalized.includes(
      "MESSAGE",
    ) ||
    entityType ===
      "ContactMessage"
  ) {
    return (
      <Inbox size={17} />
    );
  }

  if (
    normalized.includes(
      "PUBLISH",
    )
  ) {
    return (
      <Globe2 size={17} />
    );
  }

  if (
    normalized.includes(
      "UNPUBLISH",
    )
  ) {
    return (
      <Undo2 size={17} />
    );
  }

  if (
    normalized.includes(
      "DELETE",
    )
  ) {
    return (
      <Trash2 size={17} />
    );
  }

  if (
    normalized.includes(
      "ARCHIVE",
    )
  ) {
    return (
      <Archive size={17} />
    );
  }

  if (
    normalized.includes(
      "LOGIN",
    )
  ) {
    return (
      <LogIn size={17} />
    );
  }

  if (
    normalized.includes(
      "RELATION",
    ) ||
    entityType ===
      "ContentRelation"
  ) {
    return (
      <GitBranch size={17} />
    );
  }

  if (
    normalized.includes(
      "SYNC",
    ) ||
    entityType ===
      "PublishJob"
  ) {
    return (
      <RefreshCcw size={17} />
    );
  }

  if (
    normalized.includes(
      "CREATE",
    ) ||
    normalized.includes(
      "RECEIVED",
    )
  ) {
    return (
      <CirclePlus size={17} />
    );
  }

  return (
    <FilePenLine size={17} />
  );
}

function createFilterHref({
  range,
  q,
  action,
  entity,
  actor,
}: {
  range: number;
  q: string;
  action: string;
  entity: string;
  actor: string;
}) {
  const parameters =
    new URLSearchParams();

  parameters.set(
    "range",
    String(range),
  );

  if (q) {
    parameters.set("q", q);
  }

  if (action) {
    parameters.set(
      "action",
      action,
    );
  }

  if (entity) {
    parameters.set(
      "entity",
      entity,
    );
  }

  if (actor) {
    parameters.set(
      "actor",
      actor,
    );
  }

  return `/dashboard/activity?${parameters.toString()}`;
}

export default async function ActivityPage({
  searchParams,
}: PageProps) {
  const session =
    await requireOwner();

  const parameters =
    await searchParams;

  const searchQuery =
    parameters.q?.trim() ?? "";

  const selectedAction =
    parameters.action?.trim() ?? "";

  const selectedEntity =
    parameters.entity?.trim() ?? "";

  const selectedActor =
    parameters.actor?.trim() ?? "";

  const requestedRange =
    Number(parameters.range);

  const range: ActivityRange =
    supportedRanges.includes(
      requestedRange as ActivityRange,
    )
      ? (requestedRange as ActivityRange)
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

  const todayStart =
    new Date();

  todayStart.setHours(
    0,
    0,
    0,
    0,
  );

  await dbConnect();

  const query:
    Record<string, unknown> = {
    createdAt: {
      $gte: startDate,
    },
  };

  if (selectedAction) {
    query.action =
      selectedAction;
  }

  if (selectedEntity) {
    query.entityType =
      selectedEntity;
  }

  if (selectedActor) {
    query.actorLogin =
      selectedActor;
  }

  if (searchQuery) {
    const expression =
      new RegExp(
        escapeRegularExpression(
          searchQuery,
        ),
        "i",
      );

    query.$or = [
      {
        description:
          expression,
      },
      {
        action:
          expression,
      },
      {
        actorLogin:
          expression,
      },
      {
        entityType:
          expression,
      },
    ];
  }

  const [
    logs,
    actionValues,
    entityValues,
    actorValues,
    totalInRange,
    eventsToday,
  ] = await Promise.all([
    AuditLogModel.find(query)
      .sort({
        createdAt: -1,
      })
      .limit(250)
      .lean(),

    AuditLogModel.distinct(
      "action",
    ),

    AuditLogModel.distinct(
      "entityType",
    ),

    AuditLogModel.distinct(
      "actorLogin",
    ),

    AuditLogModel.countDocuments({
      createdAt: {
        $gte: startDate,
      },
    }),

    AuditLogModel.countDocuments({
      createdAt: {
        $gte: todayStart,
      },
    }),
  ]);

  const actions =
    actionValues
      .filter(
        (value):
          value is string =>
          typeof value ===
          "string",
      )
      .sort();

  const entities =
    entityValues
      .filter(
        (value):
          value is string =>
          typeof value ===
          "string",
      )
      .sort();

  const actors =
    actorValues
      .filter(
        (value):
          value is string =>
          typeof value ===
          "string",
      )
      .sort();

  const groupedLogs =
    new Map<
      string,
      typeof logs
    >();

  for (const log of logs) {
    const day =
      formatDay(log.createdAt);

    const current =
      groupedLogs.get(day) ?? [];

    current.push(log);

    groupedLogs.set(
      day,
      current,
    );
  }

  const entityTypeCount =
    new Set(
      logs.map(
        (log) =>
          log.entityType,
      ),
    ).size;

  const activeActorCount =
    new Set(
      logs.map(
        (log) =>
          log.actorLogin,
      ),
    ).size;

  return (
    <>
      <DashboardHeader
        title="Activity"
        description="A searchable operational record of changes across content, messages, publishing, relationships, and system actions."
        githubLogin={
          session.user.githubLogin
        }
      />

      <section className="activity-metrics">
        <article>
          <ShieldCheck size={19} />

          <strong>
            {totalInRange}
          </strong>

          <span>
            Events in {range} days
          </span>
        </article>

        <article>
          <FilePenLine size={19} />

          <strong>
            {eventsToday}
          </strong>

          <span>
            Events today
          </span>
        </article>

        <article>
          <Filter size={19} />

          <strong>
            {entityTypeCount}
          </strong>

          <span>
            Active entity types
          </span>
        </article>

        <article>
          <LogIn size={19} />

          <strong>
            {activeActorCount}
          </strong>

          <span>
            Active actors
          </span>
        </article>
      </section>

      <section className="activity-filter-panel">
        <form
          action="/dashboard/activity"
          className="activity-filter-form"
        >
          <input
            type="hidden"
            name="range"
            value={range}
          />

          <label className="activity-search">
            <Search
              size={17}
              strokeWidth={1.7}
            />

            <input
              type="search"
              name="q"
              defaultValue={
                searchQuery
              }
              placeholder="Search descriptions, actions, actors, or entities..."
            />
          </label>

          <label>
            <span>Action</span>

            <select
              name="action"
              defaultValue={
                selectedAction
              }
            >
              <option value="">
                All actions
              </option>

              {actions.map(
                (action) => (
                  <option
                    value={action}
                    key={action}
                  >
                    {formatLabel(
                      action,
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>Entity</span>

            <select
              name="entity"
              defaultValue={
                selectedEntity
              }
            >
              <option value="">
                All entities
              </option>

              {entities.map(
                (entity) => (
                  <option
                    value={entity}
                    key={entity}
                  >
                    {formatLabel(
                      entity,
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>Actor</span>

            <select
              name="actor"
              defaultValue={
                selectedActor
              }
            >
              <option value="">
                All actors
              </option>

              {actors.map(
                (actor) => (
                  <option
                    value={actor}
                    key={actor}
                  >
                    @{actor}
                  </option>
                ),
              )}
            </select>
          </label>

          <button
            type="submit"
            className="dashboard-primary-button"
          >
            <Filter size={16} />
            Apply filters
          </button>
        </form>

        <div className="activity-range-selector">
          <span>Period</span>

          <div>
            {supportedRanges.map(
              (days) => (
                <Link
                  href={createFilterHref({
                    range: days,
                    q: searchQuery,
                    action:
                      selectedAction,
                    entity:
                      selectedEntity,
                    actor:
                      selectedActor,
                  })}
                  key={days}
                  className={
                    days === range
                      ? "activity-range activity-range--active"
                      : "activity-range"
                  }
                >
                  {days === 365
                    ? "1 year"
                    : `${days} days`}
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="activity-timeline">
        <header>
          <div>
            <span>
              Operational timeline
            </span>

            <h2>
              Recorded activity
            </h2>
          </div>

          <strong>
            {logs.length} visible
          </strong>
        </header>

        <div className="activity-day-list">
          {Array.from(
            groupedLogs.entries(),
          ).map(
            ([day, dayLogs]) => (
              <section
                className="activity-day"
                key={day}
              >
                <header>
                  <span>{day}</span>

                  <small>
                    {dayLogs.length}{" "}
                    {dayLogs.length === 1
                      ? "event"
                      : "events"}
                  </small>
                </header>

                <div>
                  {dayLogs.map(
                    (log) => {
                      const entityId =
                        log.entityId
                          ? log.entityId.toString()
                          : null;

                      const href =
                        getActivityHref(
                          log.entityType,
                          entityId,
                        );

                      return (
                        <article
                          className="activity-event"
                          key={
                            log._id.toString()
                          }
                        >
                          <div className="activity-event__icon">
                            <ActivityIcon
                              action={
                                log.action
                              }
                              entityType={
                                log.entityType
                              }
                            />
                          </div>

                          <div className="activity-event__content">
                            <div>
                              <small>
                                {formatLabel(
                                  log.action,
                                )}
                              </small>

                              <span>
                                {formatLabel(
                                  log.entityType,
                                )}
                              </span>
                            </div>

                            <p>
                              {
                                log.description
                              }
                            </p>

                            <footer>
                              <strong>
                                @
                                {
                                  log.actorLogin
                                }
                              </strong>

                              <time>
                                {formatTime(
                                  log.createdAt,
                                )}
                              </time>

                              {entityId && (
                                <code>
                                  {entityId}
                                </code>
                              )}
                            </footer>
                          </div>

                          {href && (
                            <Link
                              href={href}
                              aria-label="Open related record"
                            >
                              <ArrowUpRight
                                size={17}
                              />
                            </Link>
                          )}
                        </article>
                      );
                    },
                  )}
                </div>
              </section>
            ),
          )}

          {logs.length === 0 && (
            <div className="activity-empty">
              <ShieldCheck
                size={27}
                strokeWidth={1.5}
              />

              <h3>
                No matching activity.
              </h3>

              <p>
                Change the filters or perform
                an operation in the dashboard
                to create a new audit record.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}