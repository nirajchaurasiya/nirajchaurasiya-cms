import Link from "next/link";
import {
  Archive,
  BarChart3,
  BookOpenText,
  Boxes,
  BriefcaseBusiness,
  FileText,
  FlaskConical,
  Home,
  Inbox,
  LogOut,
  PlaySquare,
  Settings,
  UploadCloud,
} from "lucide-react";
import { signOut } from "@/auth";

const navigation = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "All Content",
    href: "/dashboard/content",
    icon: FileText,
  },
  {
    label: "Projects",
    href: "/dashboard/content?type=PROJECT",
    icon: BriefcaseBusiness,
  },
  {
    label: "Research",
    href: "/dashboard/content?type=RESEARCH",
    icon: FlaskConical,
  },
  {
    label: "Frameworks",
    href: "/dashboard/content?type=FRAMEWORK",
    icon: Boxes,
  },
  {
    label: "Writing",
    href: "/dashboard/content?type=WRITING",
    icon: BookOpenText,
  },
  {
    label: "Media",
    href: "/dashboard/content?type=MEDIA",
    icon: PlaySquare,
  },
  {
    label: "Archive",
    href: "/dashboard/content?type=ARCHIVE",
    icon: Archive,
  },
  {
    label: "Messages",
    href: "/dashboard/messages",
    icon: Inbox,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Publishing",
    href: "/dashboard/publishing",
    icon: UploadCloud,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardSidebar() {
  async function logout() {
    "use server";

    await signOut({
      redirectTo: "/login",
    });
  }

  return (
    <aside className="dashboard-sidebar">
      <header className="dashboard-sidebar__identity">
        <div>NC</div>

        <span>
          <strong>Niraj Analytics</strong>
          <small>Private control system</small>
        </span>
      </header>

      <nav aria-label="Dashboard navigation">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              href={item.href}
              key={item.href}
            >
              <Icon
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
              />

              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action={logout}>
        <button type="submit">
          <LogOut
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          Sign out
        </button>
      </form>
    </aside>
  );
}