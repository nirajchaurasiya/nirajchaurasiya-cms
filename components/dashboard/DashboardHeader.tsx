import Link from "next/link";
import {
  ExternalLink,
  Plus,
} from "lucide-react";

type DashboardHeaderProps = {
  title: string;
  description?: string;
  githubLogin: string;
};

export default function DashboardHeader({
  title,
  description,
  githubLogin,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="dashboard-eyebrow">
          Analytics.nirajchaurasiya.com
        </p>

        <h1>{title}</h1>

        {description && (
          <p>{description}</p>
        )}
      </div>

      <div className="dashboard-header__actions">
        <span className="dashboard-owner">
          @{githubLogin}
        </span>

        <Link
          href="/dashboard/content/new"
          className="dashboard-primary-button"
        >
          <Plus
            size={16}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          New content
        </Link>

        <a
          href="https://nirajchaurasiya.com"
          target="_blank"
          rel="noreferrer"
          className="dashboard-secondary-button"
        >
          Public site

          <ExternalLink
            size={15}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </a>
      </div>
    </header>
  );
}