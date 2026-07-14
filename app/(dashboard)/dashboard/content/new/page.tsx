import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ContentEditorForm from "@/components/dashboard/ContentEditorForm";
import { requireOwner } from "@/lib/authorization";

export default async function NewContentPage() {
  const session = await requireOwner();

  return (
    <>
      <DashboardHeader
        title="New Content"
        description="Create a private working draft. Nothing becomes public until it is explicitly published."
        githubLogin={
          session.user.githubLogin
        }
      />

      <ContentEditorForm mode="create" />
    </>
  );
}