import { notFound } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { requireOwner } from "@/lib/authorization";

const sections = {
  messages: {
    title: "Messages",
    description:
      "Contact messages received from the public website.",
  },

  analytics: {
    title: "Analytics",
    description:
      "Traffic, content, engagement, and system activity.",
  },

  publishing: {
    title: "Publishing",
    description:
      "Pending, completed, and failed publication jobs.",
  },

  settings: {
    title: "Settings",
    description:
      "Public-site configuration and integration settings.",
  },
} as const;

type PageProps = {
  params: Promise<{
    section: string;
  }>;
};

export default async function SectionPage({
  params,
}: PageProps) {
  const session = await requireOwner();
  const { section } = await params;

  const configuration =
    sections[
      section as keyof typeof sections
    ];

  if (!configuration) {
    notFound();
  }

  return (
    <>
      <DashboardHeader
        title={configuration.title}
        description={configuration.description}
        githubLogin={
          session.user.githubLogin
        }
      />

      <section className="dashboard-placeholder">
        <span>Module foundation</span>

        <h2>
          This module will connect to MongoDB next.
        </h2>
      </section>
    </>
  );
}