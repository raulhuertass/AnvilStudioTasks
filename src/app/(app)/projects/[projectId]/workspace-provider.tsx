"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { MEMBERS_SELECT, toMember, type Invitation, type Member, type Project } from "@/lib/types";

export type WorkspaceData = {
  project: Project;
  currentUserId: string;
  members: Member[];
  invitations: Invitation[];
};

type WorkspaceValue = WorkspaceData & {
  isAdmin: boolean;
  refreshMembers: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace debe usarse dentro de WorkspaceProvider");
  return value;
}

export function WorkspaceProvider({
  initial,
  children,
}: {
  initial: WorkspaceData;
  children: ReactNode;
}) {
  const { project, currentUserId } = initial;
  const [supabase] = useState(() => createClient());
  const [members, setMembers] = useState(initial.members);
  const [invitations, setInvitations] = useState(initial.invitations);

  const isAdmin = members.some((m) => m.user_id === currentUserId && m.rol === "admin");

  const refreshMembers = useCallback(async () => {
    const [membersResult, invitationsResult] = await Promise.all([
      supabase.from("project_members").select(MEMBERS_SELECT).eq("project_id", project.id),
      supabase.from("project_invitations").select("*").eq("project_id", project.id),
    ]);
    if (membersResult.data) setMembers(membersResult.data.map(toMember));
    if (invitationsResult.data) setInvitations(invitationsResult.data);
  }, [supabase, project.id]);

  const value = useMemo<WorkspaceValue>(
    () => ({ project, currentUserId, members, invitations, isAdmin, refreshMembers }),
    [project, currentUserId, members, invitations, isAdmin, refreshMembers],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
