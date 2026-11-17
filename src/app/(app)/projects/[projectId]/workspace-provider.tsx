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
  type IssueLabel,
  type Label,
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
  labels: Label[];
  issueLabels: IssueLabel[];
};

type IssueUpdate = Pick<
  Database["public"]["Tables"]["issues"]["Update"],
  "titulo" | "descripcion" | "tipo" | "prioridad" | "estado" | "sprint_id" | "posicion"
>;

const NO_ASSIGNEES: string[] = [];
const NO_IDS: string[] = [];
const NO_ISSUES: Issue[] = [];
const NO_LABELS: Label[] = [];

function sortLabels(list: Label[]) {
  return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export type NewIssue = {
  titulo: string;
  descripcion: string | null;
  tipo: Issue["tipo"];
  prioridad: Issue["prioridad"];
  assignee_ids: string[];
  sprint_id: string | null;
  parent_id?: string | null;
  label_ids?: string[];
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
  issueById: Map<string, Issue>;
  subtasksOf: (issueId: string) => Issue[];
  setIssueAssignees: (issueId: string, next: string[]) => Promise<void>;
  labelIdsOf: (issueId: string) => string[];
  labelsOf: (issueId: string) => Label[];
  setIssueLabelIds: (issueId: string, next: string[]) => Promise<void>;
  createLabel: (nombre: string, color: string) => Promise<{ label?: Label; error?: string }>;
  updateLabel: (id: string, patch: { nombre?: string; color?: string }) => Promise<boolean>;
  deleteLabel: (id: string) => Promise<void>;
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
  const [labels, setLabels] = useState(() => sortLabels(initial.labels));
  const [issueLabels, setIssueLabels] = useState(initial.issueLabels);
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

  const issueById = useMemo(() => new Map(issues.map((issue) => [issue.id, issue])), [issues]);

  const subtasksByParent = useMemo(() => {
    const byParent = new Map<string, Issue[]>();
    issues.forEach((issue) => {
      if (issue.parent_id) byParent.set(issue.parent_id, [...(byParent.get(issue.parent_id) ?? []), issue]);
    });
    byParent.forEach((list) => list.sort((a, b) => a.numero - b.numero));
    return byParent;
  }, [issues]);

  const subtasksOf = useCallback(
    (issueId: string) => subtasksByParent.get(issueId) ?? NO_ISSUES,
    [subtasksByParent],
  );

  const labelsByIssue = useMemo(() => {
    const byIssue = new Map<string, string[]>();
    issueLabels.forEach(({ issue_id, label_id }) => {
      byIssue.set(issue_id, [...(byIssue.get(issue_id) ?? []), label_id]);
    });
    return byIssue;
  }, [issueLabels]);

  const labelIdsOf = useCallback(
    (issueId: string) => labelsByIssue.get(issueId) ?? NO_IDS,
    [labelsByIssue],
  );

  const labelsOf = useCallback(
    (issueId: string) => {
      const ids = labelsByIssue.get(issueId);
      return ids ? labels.filter((label) => ids.includes(label.id)) : NO_LABELS;
    },
    [labelsByIssue, labels],
  );

  const visibleIssues = useMemo(
    () =>
      issues.filter((issue) =>
        matchesFilters(issue, assigneeIdsOf(issue.id), labelIdsOf(issue.id), filters, project.clave),
      ),
    [issues, assigneeIdsOf, labelIdsOf, filters, project.clave],
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
    const [sprintsResult, issuesResult, assigneesResult, labelsResult, issueLabelsResult] =
      await Promise.all([
        supabase.from("sprints").select("*").eq("project_id", project.id),
        supabase.from("issues").select("*").eq("project_id", project.id),
        supabase.from("issue_assignees").select("*").eq("project_id", project.id),
        supabase.from("labels").select("*").eq("project_id", project.id),
        supabase.from("issue_labels").select("*").eq("project_id", project.id),
      ]);
    if (sprintsResult.data) setSprints(sprintsResult.data);
    if (issuesResult.data) setIssues(issuesResult.data);
    if (assigneesResult.data) setAssignees(assigneesResult.data);
    if (labelsResult.data) setLabels(sortLabels(labelsResult.data));
    if (issueLabelsResult.data) setIssueLabels(issueLabelsResult.data);
    await refreshMembers();
  }, [supabase, project.id, refreshMembers]);

  const createIssue = useCallback(
    async ({ assignee_ids, label_ids, ...input }: NewIssue) => {
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

      if (label_ids && label_ids.length > 0) {
        const rows = label_ids.map((label_id) => ({
          issue_id: data.id,
          label_id,
          project_id: project.id,
        }));
        const { error: labelError } = await supabase.from("issue_labels").insert(rows);
        if (labelError) {
          toast.error("La tarea se ha creado, pero no se han podido añadir las etiquetas.");
        } else {
          setIssueLabels((current) => [
            ...current,
            ...rows.filter(
              (row) =>
                !current.some(
                  (item) => item.issue_id === row.issue_id && item.label_id === row.label_id,
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

  const setIssueLabelIds = useCallback(
    async (issueId: string, next: string[]) => {
      const previous = labelsByIssue.get(issueId) ?? NO_IDS;
      const added = next.filter((labelId) => !previous.includes(labelId));
      const removed = previous.filter((labelId) => !next.includes(labelId));
      if (added.length === 0 && removed.length === 0) return;

      setIssueLabels((current) => [
        ...current.filter((item) => item.issue_id !== issueId),
        ...next.map((label_id) => ({ issue_id: issueId, label_id, project_id: project.id })),
      ]);

      const results = await Promise.all([
        added.length > 0
          ? supabase.from("issue_labels").insert(
              added.map((label_id) => ({ issue_id: issueId, label_id, project_id: project.id })),
            )
          : null,
        removed.length > 0
          ? supabase.from("issue_labels").delete().eq("issue_id", issueId).in("label_id", removed)
          : null,
      ]);

      const failure = results.find((result) => result?.error)?.error;
      if (failure) {
        toast.error(friendlyError(failure, "No se han podido cambiar las etiquetas."));
        const { data } = await supabase.from("issue_labels").select("*").eq("project_id", project.id);
        if (data) setIssueLabels(data);
      }
    },
    [supabase, project.id, labelsByIssue],
  );

  const createLabel = useCallback(
    async (nombre: string, color: string) => {
      const { data, error } = await supabase
        .from("labels")
        .insert({ project_id: project.id, nombre: nombre.trim(), color })
        .select("*")
        .single();
      if (error) {
        return {
          error:
            error.code === "23505"
              ? "Ya existe una etiqueta con ese nombre."
              : friendlyError(error, "No se ha podido crear la etiqueta."),
        };
      }
      setLabels((current) =>
        current.some((item) => item.id === data.id) ? current : sortLabels([...current, data]),
      );
      return { label: data };
    },
    [supabase, project.id],
  );

  const updateLabel = useCallback(
    async (id: string, patch: { nombre?: string; color?: string }) => {
      const { data, error } = await supabase
        .from("labels")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) {
        toast.error(
          error.code === "23505"
            ? "Ya existe una etiqueta con ese nombre."
            : friendlyError(error, "No se ha podido cambiar la etiqueta."),
        );
        return false;
      }
      setLabels((current) => sortLabels(current.map((item) => (item.id === id ? data : item))));
      return true;
    },
    [supabase],
  );

  const deleteLabel = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("labels").delete().eq("id", id);
      if (error) {
        toast.error(friendlyError(error, "No se ha podido eliminar la etiqueta."));
        return;
      }
      setLabels((current) => current.filter((item) => item.id !== id));
      setIssueLabels((current) => current.filter((item) => item.label_id !== id));
    },
    [supabase],
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
      setIssues((current) =>
        current.map((issue) => {
          const own = saved.get(issue.id);
          if (own) return own;
          // La base de datos mueve las subtareas al sprint de su padre.
          const parent = issue.parent_id ? saved.get(issue.parent_id) : undefined;
          return parent && parent.sprint_id !== issue.sprint_id
            ? { ...issue, sprint_id: parent.sprint_id }
            : issue;
        }),
      );
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
      // La base de datos borra también sus subtareas.
      setIssues((current) => current.filter((issue) => issue.id !== id && issue.parent_id !== id));
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
        { event: "INSERT", schema: "public", table: "labels", filter: byProject },
        ({ new: row }) => {
          const label = row as Label;
          setLabels((current) =>
            current.some((item) => item.id === label.id) ? current : sortLabels([...current, label]),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "labels", filter: byProject },
        ({ new: row }) => {
          const label = row as Label;
          setLabels((current) => sortLabels(current.map((item) => (item.id === label.id ? label : item))));
        },
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "labels" }, ({ old }) => {
        setLabels((current) => current.filter((item) => item.id !== old.id));
        setIssueLabels((current) => current.filter((item) => item.label_id !== old.id));
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "issue_labels", filter: byProject },
        ({ new: row }) => {
          const link = row as IssueLabel;
          setIssueLabels((current) =>
            current.some((item) => item.issue_id === link.issue_id && item.label_id === link.label_id)
              ? current
              : [...current, link],
          );
        },
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "issue_labels" }, ({ old }) => {
        setIssueLabels((current) =>
          current.filter((item) => item.issue_id !== old.issue_id || item.label_id !== old.label_id),
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
      issueById,
      subtasksOf,
      labels,
      issueLabels,
      labelIdsOf,
      labelsOf,
      setIssueLabelIds,
      createLabel,
      updateLabel,
      deleteLabel,
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
      issueById,
      subtasksOf,
      labels,
      issueLabels,
      labelIdsOf,
      labelsOf,
      setIssueLabelIds,
      createLabel,
      updateLabel,
      deleteLabel,
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
