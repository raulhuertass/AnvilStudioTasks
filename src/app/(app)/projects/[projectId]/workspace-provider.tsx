"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
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
  type IssueAssignee,
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
  assignees: IssueAssignee[];
};

type IssueUpdate = Pick<
  Database["public"]["Tables"]["issues"]["Update"],
  "titulo" | "descripcion" | "tipo" | "prioridad" | "estado" | "sprint_id" | "posicion"
>;

const NO_ASSIGNEES: string[] = [];

export type NewIssue = {
  titulo: string;
  descripcion: string | null;
  tipo: Issue["tipo"];
  prioridad: Issue["prioridad"];
  assignee_ids: string[];
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
  assigneeIdsOf: (issueId: string) => string[];
  setIssueAssignees: (issueId: string, next: string[]) => Promise<void>;
  createSprint: (input: NewSprint) => Promise<string | null>;
  startSprint: (id: string) => Promise<void>;
  closeSprint: (id: string) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  deleteProject: () => Promise<string | null>;
  connectionLost: boolean;
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
  const [assignees, setAssignees] = useState(initial.assignees);
  const [selectedIssueId, openIssue] = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [connectionLost, setConnectionLost] = useState(false);
  const router = useRouter();
  const deletingProject = useRef(false);

  const filtersActive = hasActiveFilters(filters);
  const assigneesByIssue = useMemo(() => {
    const byIssue = new Map<string, string[]>();
    assignees.forEach(({ issue_id, user_id }) => {
      byIssue.set(issue_id, [...(byIssue.get(issue_id) ?? []), user_id]);
    });
    return byIssue;
  }, [assignees]);

  const assigneeIdsOf = useCallback(
    (issueId: string) => assigneesByIssue.get(issueId) ?? NO_ASSIGNEES,
    [assigneesByIssue],
  );

  const visibleIssues = useMemo(
    () =>
      issues.filter((issue) =>
        matchesFilters(issue, assigneeIdsOf(issue.id), filters, project.clave),
      ),
    [issues, assigneeIdsOf, filters, project.clave],
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
    const [sprintsResult, issuesResult, assigneesResult] = await Promise.all([
      supabase.from("sprints").select("*").eq("project_id", project.id),
      supabase.from("issues").select("*").eq("project_id", project.id),
      supabase.from("issue_assignees").select("*").eq("project_id", project.id),
    ]);
    if (sprintsResult.data) setSprints(sprintsResult.data);
    if (issuesResult.data) setIssues(issuesResult.data);
    if (assigneesResult.data) setAssignees(assigneesResult.data);
    await refreshMembers();
  }, [supabase, project.id, refreshMembers]);

  const createIssue = useCallback(
    async ({ assignee_ids, ...input }: NewIssue) => {
      const { data, error } = await supabase
        .from("issues")
        .insert({ ...input, project_id: project.id })
        .select("*")
        .single();
      if (error) return friendlyError(error, "No se ha podido crear la tarea.");
      setIssues((current) =>
        current.some((issue) => issue.id === data.id) ? current : [...current, data],
      );

      if (assignee_ids.length > 0) {
        const rows = assignee_ids.map((user_id) => ({
          issue_id: data.id,
          user_id,
          project_id: project.id,
        }));
        const { error: assignError } = await supabase.from("issue_assignees").insert(rows);
        if (assignError) {
          // La tarea ya existe: no se devuelve error para no invitar a crearla otra vez.
          toast.error("La tarea se ha creado, pero no se ha podido asignar.");
        } else {
          setAssignees((current) => [
            ...current,
            ...rows.filter(
              (row) =>
                !current.some(
                  (item) => item.issue_id === row.issue_id && item.user_id === row.user_id,
                ),
            ),
          ]);
        }
      }
      return null;
    },
    [supabase, project.id],
  );

  // Aplica el cambio al momento y recarga las asignaciones si la base de datos lo rechaza.
  const setIssueAssignees = useCallback(
    async (issueId: string, next: string[]) => {
      const previous = assigneesByIssue.get(issueId) ?? NO_ASSIGNEES;
      const added = next.filter((userId) => !previous.includes(userId));
      const removed = previous.filter((userId) => !next.includes(userId));
      if (added.length === 0 && removed.length === 0) return;

      setAssignees((current) => [
        ...current.filter((item) => item.issue_id !== issueId),
        ...next.map((user_id) => ({ issue_id: issueId, user_id, project_id: project.id })),
      ]);

      const results = await Promise.all([
        added.length > 0
          ? supabase.from("issue_assignees").insert(
              added.map((user_id) => ({ issue_id: issueId, user_id, project_id: project.id })),
            )
          : null,
        removed.length > 0
          ? supabase
              .from("issue_assignees")
              .delete()
              .eq("issue_id", issueId)
              .in("user_id", removed)
          : null,
      ]);

      const failure = results.find((result) => result?.error)?.error;
      if (failure) {
        toast.error(friendlyError(failure, "No se ha podido cambiar la asignación."));
        const { data } = await supabase
          .from("issue_assignees")
          .select("*")
          .eq("project_id", project.id);
        if (data) setAssignees(data);
      }
    },
    [supabase, project.id, assigneesByIssue],
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

  const deleteProject = useCallback(async () => {
    deletingProject.current = true;
    const { data, error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id)
      .select("id");
    // Sin permiso, RLS no da error: simplemente no borra ninguna fila.
    if (error || data.length === 0) {
      deletingProject.current = false;
      return friendlyError(error, "No se ha podido eliminar el proyecto.");
    }
    toast.success("Proyecto eliminado.");
    router.push("/projects");
    router.refresh();
    return null;
  }, [supabase, project.id, router]);

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

  // Cambios de otros usuarios. RLS filtra INSERT y UPDATE en el servidor. Los
  // DELETE no admiten filtro y solo traen la clave primaria: se ignoran si no
  // corresponden a una fila conocida.
  useEffect(() => {
    const byProject = `project_id=eq.${project.id}`;
    let wasConnected = false;

    const channel = supabase
      .channel(`project:${project.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "issues", filter: byProject },
        ({ new: row }) => {
          const issue = row as Issue;
          setIssues((current) =>
            current.some((item) => item.id === issue.id) ? current : [...current, issue],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "issues", filter: byProject },
        ({ new: row }) => {
          const issue = row as Issue;
          setIssues((current) =>
            current.map((item) =>
              // Un evento atrasado no debe pisar un estado más reciente.
              item.id === issue.id && issue.updated_at >= item.updated_at ? issue : item,
            ),
          );
        },
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "issues" }, ({ old }) => {
        setIssues((current) => current.filter((item) => item.id !== old.id));
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "issue_assignees", filter: byProject },
        ({ new: row }) => {
          const assignee = row as IssueAssignee;
          setAssignees((current) =>
            current.some(
              (item) => item.issue_id === assignee.issue_id && item.user_id === assignee.user_id,
            )
              ? current
              : [...current, assignee],
          );
        },
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "issue_assignees" }, ({ old }) => {
        setAssignees((current) =>
          current.filter((item) => item.issue_id !== old.issue_id || item.user_id !== old.user_id),
        );
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sprints", filter: byProject },
        ({ new: row }) => {
          const sprint = row as Sprint;
          setSprints((current) =>
            current.some((item) => item.id === sprint.id) ? current : [...current, sprint],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sprints", filter: byProject },
        ({ new: row }) => {
          const sprint = row as Sprint;
          setSprints((current) => current.map((item) => (item.id === sprint.id ? sprint : item)));
        },
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "sprints" }, ({ old }) => {
        setSprints((current) => current.filter((item) => item.id !== old.id));
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "project_members", filter: byProject },
        () => {
          refreshMembers();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "project_members", filter: byProject },
        () => {
          refreshMembers();
        },
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "project_members" }, ({ old }) => {
        if (old.project_id !== project.id) return;
        if (old.user_id === currentUserId) {
          if (deletingProject.current) return;
          toast.info("Ya no eres miembro de este proyecto.");
          router.push("/projects");
          return;
        }
        refreshMembers();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionLost(false);
          // Al reconectar se recupera lo que haya cambiado mientras tanto.
          if (wasConnected) refreshAll();
          wasConnected = true;
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionLost(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, project.id, currentUserId, router, refreshMembers, refreshAll]);

  const value = useMemo<WorkspaceValue>(
    () => ({
      project,
      currentUserId,
      members,
      invitations,
      sprints,
      issues,
      assignees,
      assigneeIdsOf,
      setIssueAssignees,
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
      deleteProject,
      connectionLost,
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
      assignees,
      assigneeIdsOf,
      setIssueAssignees,
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
      deleteProject,
      connectionLost,
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
