import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { MEMBERS_SELECT, toMember } from "@/lib/types";
import { IssueSheet } from "./issue-sheet";
import { ProjectNav } from "./project-nav";
import { WorkspaceProvider } from "./workspace-provider";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function ProjectWorkspace({
  params,
  children,
}: {
  params: Promise<{ projectId: string }>;
  children: ReactNode;
}) {
  const { projectId } = await params;
  if (!UUID.test(projectId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [project, members, invitations, sprints, issues, assignees] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
    supabase.from("project_members").select(MEMBERS_SELECT).eq("project_id", projectId),
    supabase.from("project_invitations").select("*").eq("project_id", projectId),
    supabase.from("sprints").select("*").eq("project_id", projectId),
    supabase.from("issues").select("*").eq("project_id", projectId),
    supabase.from("issue_assignees").select("*").eq("project_id", projectId),
  ]);

  const failure =
    project.error ??
    members.error ??
    invitations.error ??
    sprints.error ??
    issues.error ??
    assignees.error;
  if (failure) throw new Error(failure.message);
  if (!project.data) notFound();

  return (
    <WorkspaceProvider
      key={projectId}
      initial={{
        project: project.data,
        currentUserId: user.id,
        members: (members.data ?? []).map(toMember),
        invitations: invitations.data ?? [],
        sprints: sprints.data ?? [],
        issues: issues.data ?? [],
        assignees: assignees.data ?? [],
      }}
    >
      <ProjectNav />
      {children}
      <IssueSheet />
    </WorkspaceProvider>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6" aria-label="Cargando proyecto">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-6 w-64" />
      <div className="grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ProjectLayout({
  params,
  children,
}: {
  params: Promise<{ projectId: string }>;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <ProjectWorkspace params={params}>{children}</ProjectWorkspace>
    </Suspense>
  );
}
