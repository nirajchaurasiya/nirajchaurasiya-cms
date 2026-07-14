import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Mail,
  MessageSquareText,
  User,
} from "lucide-react";
import {
  isValidObjectId,
} from "mongoose";
import Link from "next/link";
import { notFound } from "next/navigation";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MessageStatusControls from "@/components/dashboard/MessageStatusControls";
import StatusBadge from "@/components/dashboard/StatusBadge";

import { requireOwner } from "@/lib/authorization";
import { dbConnect } from "@/lib/mongodb";

import ContactMessageModel from "@/models/ContactMessage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(
  value: Date | string | null,
) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleString(
    "en-US",
    {
      dateStyle: "long",
      timeStyle: "short",
    },
  );
}

export default async function MessagePage({
  params,
}: PageProps) {
  const session = await requireOwner();

  const { id } = await params;

  if (!isValidObjectId(id)) {
    notFound();
  }

  await dbConnect();

  const message =
    await ContactMessageModel.findById(id)
      .lean();

  if (!message) {
    notFound();
  }

  const replySubject =
    encodeURIComponent(
      `Re: ${message.subject}`,
    );

  const replyBody =
    encodeURIComponent(
      `Hi ${message.name},\n\nThank you for reaching out.\n\n`,
    );

  return (
    <>
      <DashboardHeader
        title={message.subject}
        description={`${message.reason} · Message from ${message.name}`}
        githubLogin={
          session.user.githubLogin
        }
      />

      <div className="message-detail-navigation">
        <Link href="/dashboard/messages">
          <ArrowLeft size={16} />
          Back to messages
        </Link>

        <StatusBadge
          value={message.status}
        />
      </div>

      <section className="message-detail-layout">
        <article className="message-detail">
          <header>
            <div className="message-detail__avatar">
              {message.name
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div>
              <small>
                {message.reason}
              </small>

              <h2>{message.subject}</h2>

              <p>
                From{" "}
                <strong>
                  {message.name}
                </strong>
              </p>
            </div>
          </header>

          <div className="message-detail__body">
            {message.message
              .split(/\n{2,}/)
              .map((paragraph, index) => (
                <p key={index}>
                  {paragraph}
                </p>
              ))}
          </div>

          <footer>
            <a
              href={`mailto:${message.email}?subject=${replySubject}&body=${replyBody}`}
              className="dashboard-primary-button"
            >
              <Mail size={16} />
              Reply by email
            </a>

            <a
              href={`mailto:${message.email}`}
              className="dashboard-secondary-button"
            >
              Open email client

              <ExternalLink size={15} />
            </a>
          </footer>
        </article>

        <aside className="message-information">
          <section>
            <User size={18} />

            <div>
              <span>Sender</span>
              <strong>
                {message.name}
              </strong>
              <a
                href={`mailto:${message.email}`}
              >
                {message.email}
              </a>
            </div>
          </section>

          <section>
            <MessageSquareText
              size={18}
            />

            <div>
              <span>Reason</span>
              <strong>
                {message.reason}
              </strong>
              <small>
                Source: {message.source}
              </small>
            </div>
          </section>

          <section>
            <CalendarDays size={18} />

            <div>
              <span>Received</span>
              <strong>
                {formatDate(
                  message.receivedAt,
                )}
              </strong>

              <small>
                Read:{" "}
                {formatDate(
                  message.readAt,
                )}
              </small>

              <small>
                Replied:{" "}
                {formatDate(
                  message.repliedAt,
                )}
              </small>
            </div>
          </section>

          <MessageStatusControls
            messageId={id}
            currentStatus={
              message.status
            }
          />
        </aside>
      </section>
    </>
  );
}