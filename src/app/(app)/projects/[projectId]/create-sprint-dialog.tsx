"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
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
import { useWorkspace } from "./workspace-provider";

export function CreateSprintDialog() {
  const { sprints, createSprint } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (inicio && fin && fin < inicio) {
      setError("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }
    setSaving(true);
    const failure = await createSprint({
      nombre: nombre.trim(),
      fecha_inicio: inicio || null,
      fecha_fin: fin || null,
    });
    setSaving(false);
    if (failure) {
      setError(failure);
      return;
    }
    setNombre("");
    setInicio("");
    setFin("");
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next && !nombre) setNombre(`Sprint ${sprints.length + 1}`);
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <PlusIcon aria-hidden />
        Crear sprint
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Crear sprint</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sprint-nombre">Nombre</Label>
            <Input
              id="sprint-nombre"
              value={nombre}
              maxLength={100}
              required
              autoFocus
              onChange={(event) => setNombre(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sprint-inicio">Inicio (opcional)</Label>
              <Input
                id="sprint-inicio"
                type="date"
                value={inicio}
                onChange={(event) => setInicio(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sprint-fin">Fin (opcional)</Label>
              <Input
                id="sprint-fin"
                type="date"
                value={fin}
                onChange={(event) => setFin(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !nombre.trim()}>
              {saving && <Loader2Icon className="animate-spin" aria-hidden />}
              Crear sprint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
