"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "./workspace-provider";

/** Solo lo ve el propietario, el único al que RLS le permite borrar el proyecto. */
export function DeleteProjectSection() {
  const { project, currentUserId, deleteProject } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (project.owner_id !== currentUserId) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (confirmation !== project.clave) return;
    setError(null);
    setDeleting(true);
    const failure = await deleteProject();
    if (failure) {
      setDeleting(false);
      setError(failure);
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Eliminar proyecto">
      <h2 className="font-medium text-destructive">Eliminar proyecto</h2>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 p-3">
        <p className="min-w-0 flex-1 basis-60 text-sm text-muted-foreground">
          Se borrarán para todos sus tareas, sprints, comentarios y miembros. No se puede deshacer.
        </p>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) {
              setConfirmation("");
              setError(null);
            }
          }}
        >
          <DialogTrigger render={<Button variant="destructive" size="sm" />}>
            <Trash2Icon aria-hidden />
            Eliminar proyecto
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>¿Eliminar {project.nombre}?</DialogTitle>
                <DialogDescription>
                  Se borrarán para todos sus tareas, sprints, comentarios y miembros. No se puede
                  deshacer.
                </DialogDescription>
              </DialogHeader>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="delete-project-confirmation">
                  Escribe {project.clave} para confirmar
                </Label>
                <Input
                  id="delete-project-confirmation"
                  autoComplete="off"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={deleting || confirmation !== project.clave}
                >
                  {deleting && <Loader2Icon className="animate-spin" aria-hidden />}
                  Eliminar definitivamente
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
