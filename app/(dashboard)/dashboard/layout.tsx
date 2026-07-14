import type { ReactNode } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { requireOwner } from "@/lib/authorization";

export const runtime = "nodejs";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireOwner();

  return (
    <div className="dashboard-shell">
      <DashboardSidebar />

      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}