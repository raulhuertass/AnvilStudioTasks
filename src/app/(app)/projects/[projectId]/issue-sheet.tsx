"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FieldSelect, NONE } from "@/components/field-select";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { issueKey, PRIORITIES, STATUSES, TYPES } from "@/lib/issue-meta";
import type { Issue, IssuePriority, IssueStatus, IssueType } from "@/lib/types";
import { AssigneeSelect } from "./assignee-select";
import { IssueComments } from "./issue-comments";
import { IssueSubtasks } from "./issue-subtasks";
import { useWorkspace } from "./workspace-provider";

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

function IssueDetail({ issue }: { issue: Issue }) {
  const {
    project,
    members,
    sprints,
    updateIssue,
    deleteIssue,
    assigneeIdsOf,
    setIssueAssignees,
    issueById,
    subtasksOf,
    openIssue,
  } = useWorkspace();
  const parent = issue.parent_id ? (issueById.get(issue.parent_id) ?? null) : null;
  // null = sin editar: se muestra el valor guardado, que puede cambiar en tiempo real.
  const [tituloDraft, setTituloDraft] = useState<string | null>(null);
  const [descripcionDraft, setDescripcionDraft] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reporter = members.find((member) => member.user_id === issue.reporter_id);
  const sprintOptions = [
    { value: NONE, label: "Backlog" },
    ...sprints
      .filter((sprint) => sprint.estado !== "cerrado" || sprint.id === issue.sprint_id)
      .map((sprint) => ({ value: sprint.id, label: sprint.nombre })),
  ];

  async function saveTitulo() {
    if (tituloDraft === null) return;
    const titulo = tituloDraft.trim();
    setTituloDraft(null);
    if (!titulo) {
      toast.error("El título no puede estar vacío.");
      return;
    }
    if (titulo !== issue.titulo) await updateIssue(issue.id, { titulo });
  }

  async function saveDescripcion() {
    if (descripcionDraft === null) return;
    const descripcion = descripcionDraft.trim() || null;
    setDescripcionDraft(null);
    if (descripcion !== issue.descripcion) await updateIssue(issue.id, { descripcion });
  }

  async function remove() {
    const count = subtasksOf(issue.id).length;
    const extra =
      count === 0 ? "" : ` También se borrarán sus ${count === 1 ? "subtarea" : `${count} subtareas`}.`;
    if (!window.confirm(`¿Eliminar ${issueKey(project.clave, issue)}?${extra} No se puede deshacer.`)) {
      return;
    }
    setDeleting(true);
    const deleted = await deleteIssue(issue.id);
    if (!deleted) setDeleting(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-6">
      {parent && (
        <p className="text-sm text-muted-foreground">
          Subtarea de{" "}
          <button
            type="button"
            onClick={() => openIssue(parent.id)}
            className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {issueKey(project.clave, parent)} {parent.titulo}
          </button>
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="detail-titulo">Título</Label>
        <Input
          id="detail-titulo"
          maxLength={255}
          value={tituloDraft ?? issue.titulo}
          onFocus={() => setTituloDraft(issue.titulo)}
          onChange={(event) => setTituloDraft(event.target.value)}
          onBlur={saveTitulo}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="detail-estado">Estado</Label>
          <FieldSelect
            id="detail-estado"
            value={issue.estado}
            options={STATUSES}
            onChange={(estado) => updateIssue(issue.id, { estado: estado as IssueStatus })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="detail-sprint">Sprint</Label>
          {parent ? (
            // La subtarea siempre está en el sprint de su padre.
            <p id="detail-sprint" className="flex h-8 items-center text-sm text-muted-foreground">
              {sprints.find((sprint) => sprint.id === issue.sprint_id)?.nombre ?? "Backlog"} (el de la
              tarea padre)
            </p>
          ) : (
            <FieldSelect
              id="detail-sprint"
              value={issue.sprint_id ?? NONE}
              options={sprintOptions}
              onChange={(next) => updateIssue(issue.id, { sprint_id: next === NONE ? null : next })}
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="detail-tipo">Tipo</Label>
          <FieldSelect
            id="detail-tipo"
            value={issue.tipo}
            options={TYPES}
            onChange={(tipo) => updateIssue(issue.id, { tipo: tipo as IssueType })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="detail-prioridad">Prioridad</Label>
          <FieldSelect
            id="detail-prioridad"
            value={issue.prioridad}
            options={PRIORITIES}
            onChange={(prioridad) => updateIssue(issue.id, { prioridad: prioridad as IssuePriority })}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="detail-asignado">Asignado</Label>
          <AssigneeSelect
            id="detail-asignado"
            value={assigneeIdsOf(issue.id)}
            onChange={(next) => setIssueAssignees(issue.id, next)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="detail-descripcion">Descripción</Label>
          {descripcionDraft === null && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setDescripcionDraft(issue.descripcion ?? "")}
            >
              <PencilIcon aria-hidden />
              Editar
            </Button>
          )}
        </div>
        {descripcionDraft !== null ? (
          <Textarea
            id="detail-descripcion"
            rows={8}
            autoFocus
            placeholder="Admite markdown"
            value={descripcionDraft}
            onChange={(event) => setDescripcionDraft(event.target.value)}
            onBlur={saveDescripcion}
          />
        ) : issue.descripcion ? (
          <div className="rounded-lg border p-3">
            <Markdown>{issue.descripcion}</Markdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin descripción.</p>
        )}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <dt>Informador</dt>
        <dd>{reporter?.nombre ?? "Antiguo miembro"}</dd>
        <dt>Creada</dt>
        <dd>{dateFormat.format(new Date(issue.created_at))}</dd>
        <dt>Actualizada</dt>
        <dd>{dateFormat.format(new Date(issue.updated_at))}</dd>
      </dl>

      {!parent && (
        <>
          <Separator />
          <IssueSubtasks parent={issue} />
        </>
      )}

      <Separator />
      <IssueComments key={issue.id} issueId={issue.id} />
      <Separator />

      <div>
        <Button variant="destructive" size="sm" disabled={deleting} onClick={remove}>
          <Trash2Icon aria-hidden />
          Eliminar tarea
        </Button>
      </div>
    </div>
  );
}

export function IssueSheet() {
  const { project, issues, selectedIssueId, openIssue } = useWorkspace();
  const issue = issues.find((item) => item.id === selectedIssueId) ?? null;

  return (
    <Sheet
      open={Boolean(issue)}
      onOpenChange={(open) => {
        if (!open) openIssue(null);
      }}
    >
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{issue ? issueKey(project.clave, issue) : "Tarea"}</SheetTitle>
          <SheetDescription className="sr-only">Detalle y comentarios de la tarea</SheetDescription>
        </SheetHeader>
        {issue && <IssueDetail key={issue.id} issue={issue} />}
      </SheetContent>
    </Sheet>
  );
}
