import Link from "next/link";
import { ArrowUpRight, Inbox, Search } from "lucide-react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";

import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";

import ContactMessageModel from "@/models/ContactMessage";

import { messageStatuses, type MessageStatus } from "@/types/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
};

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const session = await requireOwner();

  const { status, q } = await searchParams;

  const selectedStatus = messageStatuses.includes(status as MessageStatus)
    ? (status as MessageStatus)
    : null;

  const searchQuery = q?.trim() ?? "";

  await dbConnect();

  const query: Record<string, unknown> = {};

  if (selectedStatus) {
    query.status = selectedStatus;
  }

  if (searchQuery) {
    const safeQuery = escapeRegularExpression(searchQuery);

    const expression = new RegExp(safeQuery, "i");

    query.$or = [
      {
        name: expression,
      },
      {
        email: expression,
      },
      {
        subject: expression,
      },
      {
        message: expression,
      },
      {
        reason: expression,
      },
    ];
  }

  const [
    messages,
    totalCount,
    newCount,
    readCount,
    repliedCount,
    archivedCount,
    spamCount,
  ] = await Promise.all([
    ContactMessageModel.find(query)
      .sort({
        receivedAt: -1,
      })
      .limit(100)
      .lean(),

    ContactMessageModel.countDocuments(),

    ContactMessageModel.countDocuments({
      status: "NEW",
    }),

    ContactMessageModel.countDocuments({
      status: "READ",
    }),

    ContactMessageModel.countDocuments({
      status: "REPLIED",
    }),

    ContactMessageModel.countDocuments({
      status: "ARCHIVED",
    }),

    ContactMessageModel.countDocuments({
      status: "SPAM",
    }),
  ]);

  const filters = [
    {
      label: "All",
      value: "",
      count: totalCount,
    },
    {
      label: "New",
      value: "NEW",
      count: newCount,
    },
    {
      label: "Read",
      value: "READ",
      count: readCount,
    },
    {
      label: "Replied",
      value: "REPLIED",
      count: repliedCount,
    },
    {
      label: "Archived",
      value: "ARCHIVED",
      count: archivedCount,
    },
    {
      label: "Spam",
      value: "SPAM",
      count: spamCount,
    },
  ];

  return (
    <>
      <DashboardHeader
        title="Messages"
        description="Review contact messages received through the public website."
        githubLogin={session.user.githubLogin}
      />

      <section className="message-inbox">
        <header className="message-inbox__toolbar">
          <form className="message-search" action="/dashboard/messages">
            {selectedStatus && (
              <input type="hidden" name="status" value={selectedStatus} />
            )}

            <Search size={17} strokeWidth={1.7} />

            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search sender, email, subject, or message..."
            />

            <button type="submit">Search</button>
          </form>

          <div className="message-filters">
            {filters.map((filter) => {
              const parameters = new URLSearchParams();

              if (filter.value) {
                parameters.set("status", filter.value);
              }

              if (searchQuery) {
                parameters.set("q", searchQuery);
              }

              const href =
                parameters.size > 0
                  ? `/dashboard/messages?${parameters.toString()}`
                  : "/dashboard/messages";

              const isActive =
                selectedStatus === filter.value ||
                (!selectedStatus && filter.value === "");

              return (
                <Link
                  href={href}
                  key={filter.label}
                  className={
                    isActive
                      ? "message-filter message-filter--active"
                      : "message-filter"
                  }
                >
                  {filter.label}

                  <span>{filter.count}</span>
                </Link>
              );
            })}
          </div>
        </header>

        <div className="message-list">
          {messages.map((message) => (
            <Link
              href={`/dashboard/messages/${message._id.toString()}`}
              className={
                message.status === "NEW"
                  ? "message-row message-row--new"
                  : "message-row"
              }
              key={message._id.toString()}
            >
              <div className="message-row__sender">
                <span>{message.name.slice(0, 1).toUpperCase()}</span>

                <div>
                  <strong>{message.name}</strong>

                  <small>{message.email}</small>
                </div>
              </div>

              <div className="message-row__content">
                <div>
                  <small>{message.reason}</small>

                  <h2>{message.subject}</h2>
                </div>

                <p>{message.message}</p>
              </div>

              <div className="message-row__metadata">
                <StatusBadge value={message.status} />

                <time>{formatDate(message.receivedAt)}</time>
              </div>

              <ArrowUpRight size={17} strokeWidth={1.8} />
            </Link>
          ))}

          {messages.length === 0 && (
            <div className="message-empty">
              <Inbox size={27} strokeWidth={1.5} />

              <h2>No matching messages.</h2>

              <p>New messages from the public contact form will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
