"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  matchesFilters,
  type IssueFilters,
} from "@/lib/filters";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import {
  MEMBERS_SELECT,
  toMember,
  type Invitation,
  type Issue,
  type Member,
  type Project,
  type Sprint,
} from "@/lib/types";

export type WorkspaceData = {
  project: Project;
  currentUserId: string;
  members: Member[];
  invitations: Invitation[];
  sprints: Sprint[];
  issues: Issue[];
};

type IssueUpdate = Pick<
  Database["public"]["Tables"]["issues"]["Update"],
  "titulo" | "descripcion" | "tipo" | "prioridad" | "estado" | "assignee_id" | "sprint_id" | "posicion"
>;

export type NewIssue = {
  titulo: string;
  descripcion: string | null;
  tipo: Issue["tipo"];
  prioridad: Issue["prioridad"];
  assignee_id: string | null;
  sprint_id: string | null;
};

export type NewSprint = {
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
};

type WorkspaceValue = WorkspaceData & {
  isAdmin: boolean;
  activeSprint: Sprint | null;
  refreshMembers: () => Promise<void>;
  refreshAll: () => Promise<void>;
  createIssue: (input: NewIssue) => Promise<string | null>;
  updateIssue: (id: string, patch: IssueUpdate) => Promise<boolean>;
  updateIssues: (changes: { id: string; patch: IssueUpdate }[]) => Promise<boolean>;
  deleteIssue: (id: string) => Promise<boolean>;
  createSprint: (input: NewSprint) => Promise<string | null>;
  startSprint: (id: string) => Promise<void>;
  closeSprint: (id: string) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  selectedIssueId: string | null;
  filters: IssueFilters;
  setFilters: (filters: IssueFilters) => void;
  filtersActive: boolean;
  visibleIssues: Issue[];
  openIssue: (id: string | null) => void;
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
  const [sprints, setSprints] = useState(initial.sprints);
  const [issues, setIssues] = useState(initial.issues);
  const [selectedIssueId, openIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const filtersActive = hasActiveFilters(filters);
  const visibleIssues = useMemo(
    () => issues.filter((issue) => matchesFilters(issue, filters, project.clave)),
    [issues, filters, project.clave],
  );

  const isAdmin = members.some((m) => m.user_id === currentUserId && m.rol === "admin");
  const activeSprint = useMemo(() => sprints.find((s) => s.estado === "activo") ?? null, [sprints]);

  const refreshMembers = useCallback(async () => {
    const [membersResult, invitationsResult] = await Promise.all([
      supabase.from("project_members").select(MEMBERS_SELECT).eq("project_id", project.id),
      supabase.from("project_invitations").select("*").eq("project_id", project.id),
    ]);
    if (membersResult.data) setMembers(membersResult.data.map(toMember));
    if (invitationsResult.data) setInvitations(invitationsResult.data);
  }, [supabase, project.id]);

  const refreshAll = useCallback(async () => {
    const [sprintsResult, issuesResult] = await Promise.all([
      supabase.from("sprints").select("*").eq("project_id", project.id),
      supabase.from("issues").select("*").eq("project_id", project.id),
    ]);
    if (sprintsResult.data) setSprints(sprintsResult.data);
    if (issuesResult.data) setIssues(issuesResult.data);
    await refreshMembers();
  }, [supabase, project.id, refreshMembers]);

  const createIssue = useCallback(
    async (input: NewIssue) => {
      const { data, error } = await supabase
        .from("issues")
        .insert({ ...input, project_id: project.id })
        .select("*")
        .single();
      if (error) return friendlyError(error, "No se ha podido crear la tarea.");
      setIssues((current) =>
        current.some((issue) => issue.id === data.id) ? current : [...current, data],
      );
      return null;
    },
    [supabase, project.id],
  );

  // Aplica el cambio al momento y lo deshace si la base de datos lo rechaza.
  const updateIssues = useCallback(
    async (changes: { id: string; patch: IssueUpdate }[]) => {
      const patches = new Map(changes.map((change) => [change.id, change.patch]));
      let previous: Issue[] = [];
      setIssues((current) => {
        previous = current.filter((issue) => patches.has(issue.id));
        return current.map((issue) => {
          const patch = patches.get(issue.id);
          return patch ? { ...issue, ...patch } : issue;
        });
      });

      const results = await Promise.all(
        changes.map(({ id, patch }) =>
          supabase.from("issues").update(patch).eq("id", id).select("*").single(),
        ),
      );

      const failure = results.find((result) => result.error)?.error;
      if (failure) {
        toast.error(friendlyError(failure, "No se ha podido guardar el cambio."));
        const undo = new Map(previous.map((issue) => [issue.id, issue]));
        setIssues((current) => current.map((issue) => undo.get(issue.id) ?? issue));
        return false;
      }

      const saved = new Map(results.map((result) => [result.data!.id, result.data!]));
      setIssues((current) => current.map((issue) => saved.get(issue.id) ?? issue));
      return true;
    },
    [supabase],
  );

  const updateIssue = useCallback(
    (id: string, patch: IssueUpdate) => updateIssues([{ id, patch }]),
    [updateIssues],
  );

  const deleteIssue = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("issues").delete().eq("id", id);
      if (error) {
        toast.error(friendlyError(error, "No se ha podido eliminar la tarea."));
        return false;
      }
      setIssues((current) => current.filter((issue) => issue.id !== id));
      openIssue((current) => (current === id ? null : current));
      return true;
    },
    [supabase],
  );

  const createSprint = useCallback(
    async (input: NewSprint) => {
      const { data, error } = await supabase
        .from("sprints")
        .insert({ ...input, project_id: project.id })
        .select("*")
        .single();
      if (error) return friendlyError(error, "No se ha podido crear el sprint.");
      setSprints((current) =>
        current.some((sprint) => sprint.id === data.id) ? current : [...current, data],
      );
      return null;
    },
    [supabase, project.id],
  );

  const startSprint = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc("start_sprint", { p_sprint_id: id });
      if (error) {
        toast.error(friendlyError(error, "No se ha podido iniciar el sprint."));
        return;
      }
      toast.success("Sprint iniciado.");
      await refreshAll();
    },
    [supabase, refreshAll],
  );

  const closeSprint = useCallback(
    async (id: string) => {
      const { data, error } = await supabase.rpc("close_sprint", { p_sprint_id: id });
      if (error) {
        toast.error(friendlyError(error, "No se ha podido cerrar el sprint."));
        return;
      }
      toast.success(
        data === 0
          ? "Sprint cerrado."
          : `Sprint cerrado. ${data === 1 ? "1 tarea sin terminar ha vuelto" : `${data} tareas sin terminar han vuelto`} al backlog.`,
      );
      await refreshAll();
    },
    [supabase, refreshAll],
  );

  const deleteSprint = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("sprints").delete().eq("id", id);
      if (error) {
        toast.error(friendlyError(error, "No se ha podido eliminar el sprint."));
        return;
      }
      await refreshAll();
    },
    [supabase, refreshAll],
  );

  const value = useMemo<WorkspaceValue>(
    () => ({
      project,
      currentUserId,
      members,
      invitations,
      sprints,
      issues,
      isAdmin,
      activeSprint,
      refreshMembers,
      refreshAll,
      createIssue,
      updateIssue,
      updateIssues,
      deleteIssue,
      createSprint,
      startSprint,
      closeSprint,
      deleteSprint,
      selectedIssueId,
      filters,
      filtersActive,
      visibleIssues,
      openIssue,
      setFilters,
    }),
    [
      project,
      currentUserId,
      members,
      invitations,
      sprints,
      issues,
      isAdmin,
      activeSprint,
      refreshMembers,
      refreshAll,
      createIssue,
      updateIssue,
      updateIssues,
      deleteIssue,
      createSprint,
      startSprint,
      closeSprint,
      deleteSprint,
      selectedIssueId,
      filters,
      filtersActive,
      visibleIssues,
      openIssue,
      setFilters,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
