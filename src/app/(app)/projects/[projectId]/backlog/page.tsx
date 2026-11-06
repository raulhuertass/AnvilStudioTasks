"use client";

import { Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { FieldSelect, NONE } from "@/components/field-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { byPosition, issueKey, priorityMeta, STATUSES, typeMeta } from "@/lib/issue-meta";
import type { Issue, Sprint } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AssigneeAvatars } from "../assignee-avatars";
import { CreateIssueDialog } from "../create-issue-dialog";
import { CreateSprintDialog } from "../create-sprint-dialog";
import { useWorkspace } from "../workspace-provider";

function IssueRow({ issue, moveOptions }: { issue: Issue; moveOptions: { value: string; label: string }[] }) {
  const { project, updateIssue, openIssue } = useWorkspace();
  const type = typeMeta(issue.tipo);
  const priority = priorityMeta(issue.prioridad);
  const key = issueKey(project.clave, issue);
  const status = STATUSES.find((item) => item.value === issue.estado)?.label;

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
      <span title={type.label}>
        <type.icon className={cn("size-4", type.className)} aria-label={type.label} />
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">{key}</span>
      <button
        type="button"
        onClick={() => openIssue(issue.id)}
        className="min-w-40 flex-1 truncate rounded-sm text-left text-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {issue.titulo}
      </button>
      <Badge variant="outline">{status}</Badge>
      <span title={`Prioridad ${priority.label.toLowerCase()}`}>
        <priority.icon
          className={cn("size-4", priority.className)}
          aria-label={`Prioridad ${priority.label.toLowerCase()}`}
        />
      </span>
      <AssigneeAvatars issueId={issue.id} />
      <FieldSelect
        label={`Mover ${key}`}
        size="sm"
        className="w-36"
        value={issue.sprint_id ?? NONE}
        options={moveOptions}
        onChange={(next) => updateIssue(issue.id, { sprint_id: next === NONE ? null : next })}
      />
    </li>
  );
}

function IssueList({
  issues,
  moveOptions,
  empty,
}: {
  issues: Issue[];
  moveOptions: { value: string; label: string }[];
  empty: string;
}) {
  if (issues.length === 0) {
    return <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="divide-y rounded-xl border">
      {issues.map((issue) => (
        <IssueRow key={issue.id} issue={issue} moveOptions={moveOptions} />
      ))}
    </ul>
  );
}

function SprintActions({ sprint, issueCount }: { sprint: Sprint; issueCount: number }) {
  const { activeSprint, startSprint, closeSprint, deleteSprint } = useWorkspace();
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    await action();
    setBusy(false);
  }

  if (sprint.estado === "activo") {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => {
          if (window.confirm(`¿Cerrar ${sprint.nombre}? Las tareas sin terminar volverán al backlog.`)) {
            run(() => closeSprint(sprint.id));
          }
        }}
      >
        Cerrar sprint
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        disabled={busy || Boolean(activeSprint)}
        title={activeSprint ? "Cierra primero el sprint activo" : undefined}
        onClick={() => run(() => startSprint(sprint.id))}
      >
        Iniciar sprint
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        disabled={busy}
        aria-label={`Eliminar ${sprint.nombre}`}
        title="Eliminar sprint"
        onClick={() => {
          const warning = issueCount > 0 ? " Sus tareas volverán al backlog." : "";
          if (window.confirm(`¿Eliminar ${sprint.nombre}?${warning}`)) {
            run(() => deleteSprint(sprint.id));
          }
        }}
      >
        <Trash2Icon />
      </Button>
    </>
  );
}

export default function BacklogPage() {
  const { visibleIssues: issues, filtersActive, sprints } = useWorkspace();

  const openSprints = useMemo(
    () =>
      sprints
        .filter((sprint) => sprint.estado !== "cerrado")
        .sort((a, b) => Number(b.estado === "activo") - Number(a.estado === "activo") || a.nombre.localeCompare(b.nombre, "es", { numeric: true })),
    [sprints],
  );

  const moveOptions = useMemo(
    () => [
      { value: NONE, label: "Backlog" },
      ...openSprints.map((sprint) => ({ value: sprint.id, label: sprint.nombre })),
    ],
    [openSprints],
  );

  const backlogIssues = useMemo(
    () => issues.filter((issue) => issue.sprint_id === null).sort(byPosition),
    [issues],
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 sm:p-6">
      <div className="flex justify-end">
        <CreateSprintDialog />
      </div>

      {openSprints.map((sprint) => {
        const sprintIssues = issues.filter((issue) => issue.sprint_id === sprint.id).sort(byPosition);
        return (
          <section key={sprint.id} className="flex flex-col gap-3" aria-label={sprint.nombre}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium">{sprint.nombre}</h2>
              {sprint.estado === "activo" && <Badge>Activo</Badge>}
              <span className="text-xs text-muted-foreground">
                {sprintIssues.length} {sprintIssues.length === 1 ? "tarea" : "tareas"}
                {(sprint.fecha_inicio || sprint.fecha_fin) &&
                  ` · ${sprint.fecha_inicio ?? "?"} → ${sprint.fecha_fin ?? "?"}`}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <SprintActions sprint={sprint} issueCount={sprintIssues.length} />
              </div>
            </div>
            <IssueList
              issues={sprintIssues}
              moveOptions={moveOptions}
              empty={filtersActive ? "Ninguna tarea coincide con los filtros." : "Sin tareas. Muévelas aquí desde el backlog."}
            />
          </section>
        );
      })}

      <section className="flex flex-col gap-3" aria-label="Backlog">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">
            Backlog <span className="text-xs font-normal text-muted-foreground">({backlogIssues.length})</span>
          </h2>
          <CreateIssueDialog sprintId={null} />
        </div>
        <IssueList issues={backlogIssues} moveOptions={moveOptions} empty={filtersActive ? "Ninguna tarea coincide con los filtros." : "El backlog está vacío."} />
      </section>
    </main>
  );
}
