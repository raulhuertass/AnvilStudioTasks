"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { FieldSelect } from "@/components/field-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { issueKey, STATUSES } from "@/lib/issue-meta";
import type { Issue, IssueStatus } from "@/lib/types";
import { AssigneeAvatars } from "./assignee-avatars";
import { useWorkspace } from "./workspace-provider";

export function IssueSubtasks({ parent }: { parent: Issue }) {
  const { project, subtasksOf, createIssue, updateIssue, openIssue } = useWorkspace();
  const subtasks = subtasksOf(parent.id);
  const done = subtasks.filter((subtask) => subtask.estado === "hecho").length;
  const [titulo, setTitulo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(event: FormEvent) {
    event.preventDefault();
    const text = titulo.trim();
    if (!text || saving) return;
    setSaving(true);
    setError(null);
    const failure = await createIssue({
      titulo: text,
      descripcion: null,
      tipo: "tarea",
      prioridad: parent.prioridad,
      assignee_ids: [],
      sprint_id: parent.sprint_id,
      parent_id: parent.id,
    });
    setSaving(false);
    if (failure) {
      setError(failure);
      return;
    }
    setTitulo("");
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Subtareas">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-medium">Subtareas</h3>
        {subtasks.length > 0 && (
          <>
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Subtareas hechas"
              aria-valuemin={0}
              aria-valuemax={subtasks.length}
              aria-valuenow={done}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(done / subtasks.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {done}/{subtasks.length}
            </span>
          </>
        )}
      </div>

      {subtasks.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {subtasks.map((subtask) => (
            <li key={subtask.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 p-2">
              <span className="shrink-0 text-xs text-muted-foreground">
                {issueKey(project.clave, subtask)}
              </span>
              <button
                type="button"
                onClick={() => openIssue(subtask.id)}
                className={`min-w-32 flex-1 truncate rounded-sm text-left text-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${subtask.estado === "hecho" ? "text-muted-foreground line-through" : ""}`}
              >
                {subtask.titulo}
              </button>
              <AssigneeAvatars issueId={subtask.id} />
              <FieldSelect
                label={`Estado de ${issueKey(project.clave, subtask)}`}
                size="sm"
                className="w-32"
                value={subtask.estado}
                options={STATUSES}
                onChange={(estado) => updateIssue(subtask.id, { estado: estado as IssueStatus })}
              />
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex gap-2">
        <Input
          aria-label="Título de la nueva subtarea"
          placeholder="Añadir subtarea"
          maxLength={255}
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
        />
        <Button type="submit" variant="outline" disabled={saving || !titulo.trim()}>
          {saving ? <Loader2Icon className="animate-spin" aria-hidden /> : <PlusIcon aria-hidden />}
          Añadir
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
