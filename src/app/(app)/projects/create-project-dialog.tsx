"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

function suggestKey(nombre: string) {
  const clean = nombre
    .normalize("NFD")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .toUpperCase()
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const key = words.length > 1 ? words.map((word) => word[0]).join("") : clean.slice(0, 4);
  return /^[0-9]/.test(key) ? `P${key}`.slice(0, 10) : key.slice(0, 10);
}

export function CreateProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [clave, setClave] = useState("");
  const [claveTouched, setClaveTouched] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^[A-Z][A-Z0-9]{1,9}$/.test(clave)) {
      setError("La clave debe tener de 2 a 10 letras o números y empezar por una letra.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({ nombre: nombre.trim(), clave, descripcion: descripcion.trim() || null })
      .select("id")
      .single();

    if (insertError) {
      setSaving(false);
      setError(
        insertError.code === "23505"
          ? "Ya tienes un proyecto con esa clave."
          : friendlyError(insertError, "No se ha podido crear el proyecto."),
      );
      return;
    }
    router.push(`/projects/${data.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon aria-hidden />
        Nuevo proyecto
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Nuevo proyecto</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-nombre">Nombre</Label>
            <Input
              id="project-nombre"
              value={nombre}
              maxLength={100}
              required
              autoFocus
              onChange={(event) => {
                setNombre(event.target.value);
                if (!claveTouched) setClave(suggestKey(event.target.value));
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-clave">Clave</Label>
            <Input
              id="project-clave"
              value={clave}
              maxLength={10}
              required
              placeholder="WEB"
              onChange={(event) => {
                setClaveTouched(true);
                setClave(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
              }}
            />
            <p className="text-xs text-muted-foreground">
              Prefijo de las tareas, como {clave || "WEB"}-12. No se puede cambiar después.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-descripcion">Descripción (opcional)</Label>
            <Textarea
              id="project-descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2Icon className="animate-spin" aria-hidden />}
              Crear proyecto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
