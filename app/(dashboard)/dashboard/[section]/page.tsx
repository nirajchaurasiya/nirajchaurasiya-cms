import { notFound } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { requireOwner } from "@/lib/authorization";
import { ContentType } from "@/types/content";

const sections = {
  projects: {
    type: "PROJECT",
    title: "Projects",
    description: "Manage software, engineering, and platform projects.",
  },

  research: {
    type: "RESEARCH",
    title: "Research",
    description: "Manage research questions, methods, claims, and limitations.",
  },

  frameworks: {
    type: "FRAMEWORK",
    title: "Frameworks",
    description: "Manage public reasoning frameworks and their versions.",
  },

  writing: {
    type: "WRITING",
    title: "Writing",
    description:
      "Manage essays, reflections, research notes, and building notes.",
  },

  books: {
    type: "BOOK",
    title: "Books",
    description:
      "Manage books, intellectual conversations, reading threads, open questions, and dated reflections.",
  },

  media: {
    type: "MEDIA",
    title: "Media",
    description: "Manage videos, talks, presentations, and media series.",
  },

  timeline: {
    type: "TIMELINE",
    title: "Timeline",
    description:
      "Manage milestones, versions, launches, and meaningful changes.",
  },

  archive: {
    type: "ARCHIVE",
    title: "Archive",
    description:
      "Manage deprecated systems, previous versions, and preserved lessons.",
  },
} satisfies Record<
  string,
  {
    type: ContentType;
    title: string;
    description: string;
  }
>;

type PageProps = {
  params: Promise<{
    section: string;
  }>;
};

export default async function SectionPage({ params }: PageProps) {
  const session = await requireOwner();
  const { section } = await params;

  const configuration = sections[section as keyof typeof sections];

  if (!configuration) {
    notFound();
  }

  return (
    <>
      <DashboardHeader
        title={configuration.title}
        description={configuration.description}
        githubLogin={session.user.githubLogin}
      />

      <section className="dashboard-placeholder">
        <span>Module foundation</span>

        <h2>This module will connect to MongoDB next.</h2>
      </section>
    </>
  );
}
