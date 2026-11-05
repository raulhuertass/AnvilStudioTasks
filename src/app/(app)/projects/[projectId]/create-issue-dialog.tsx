"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { FieldSelect, NONE } from "@/components/field-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITIES, TYPES } from "@/lib/issue-meta";
import type { IssuePriority, IssueType } from "@/lib/types";
import { useWorkspace } from "./workspace-provider";

export function CreateIssueDialog({
  sprintId,
  triggerLabel = "Nueva tarea",
  triggerVariant = "default",
}: {
  sprintId: string | null;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost";
}) {
  const { members, createIssue } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<IssueType>("tarea");
  const [prioridad, setPrioridad] = useState<IssuePriority>("media");
  const [assignee, setAssignee] = useState(NONE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const failure = await createIssue({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      tipo,
      prioridad,
      assignee_id: assignee === NONE ? null : assignee,
      sprint_id: sprintId,
    });
    setSaving(false);
    if (failure) {
      setError(failure);
      return;
    }
    setTitulo("");
    setDescripcion("");
    setTipo("tarea");
    setPrioridad("media");
    setAssignee(NONE);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={triggerVariant} size="sm" />}>
        <PlusIcon aria-hidden />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Nueva tarea</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="issue-titulo">Título</Label>
            <Input
              id="issue-titulo"
              value={titulo}
              maxLength={255}
              required
              autoFocus
              onChange={(event) => setTitulo(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="issue-tipo">Tipo</Label>
              <FieldSelect
                id="issue-tipo"
                value={tipo}
                options={TYPES}
                onChange={(next) => setTipo(next as IssueType)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="issue-prioridad">Prioridad</Label>
              <FieldSelect
                id="issue-prioridad"
                value={prioridad}
                options={PRIORITIES}
                onChange={(next) => setPrioridad(next as IssuePriority)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="issue-asignado">Asignado</Label>
            <FieldSelect
              id="issue-asignado"
              value={assignee}
              options={[
                { value: NONE, label: "Sin asignar" },
                ...members.map((member) => ({ value: member.user_id, label: member.nombre })),
              ]}
              onChange={setAssignee}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="issue-descripcion">Descripción (markdown, opcional)</Label>
            <Textarea
              id="issue-descripcion"
              rows={4}
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !titulo.trim()}>
              {saving && <Loader2Icon className="animate-spin" aria-hidden />}
              Crear tarea
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
