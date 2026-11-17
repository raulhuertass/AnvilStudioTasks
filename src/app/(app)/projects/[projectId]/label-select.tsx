"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { FieldSelect } from "@/components/field-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LABEL_COLORS, labelColor } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { LabelChip } from "./label-chips";
import { useWorkspace } from "./workspace-provider";

export const COLOR_OPTIONS = LABEL_COLORS.map((color) => ({
  value: color.value,
  label: color.label,
  leading: <span className={cn("size-2.5 shrink-0 rounded-full", color.dot)} />,
}));

/** Formulario corto para crear una etiqueta del proyecto. */
export function CreateLabelForm({ onCreated }: { onCreated?: (labelId: string) => void }) {
  const { createLabel } = useWorkspace();
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState<string>("azul");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!nombre.trim() || saving) return;
    setSaving(true);
    setError(null);
    const result = await createLabel(nombre, color);
    setSaving(false);
    if (result.error || !result.label) {
      setError(result.error ?? "No se ha podido crear la etiqueta.");
      return;
    }
    setNombre("");
    onCreated?.(result.label.id);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Input
          aria-label="Nombre de la nueva etiqueta"
          placeholder="Nueva etiqueta"
          maxLength={40}
          className="min-w-32 flex-1"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
        />
        <FieldSelect
          label="Color de la nueva etiqueta"
          className="w-32"
          value={color}
          options={COLOR_OPTIONS}
          onChange={setColor}
        />
        <Button type="submit" variant="outline" disabled={saving || !nombre.trim()}>
          {saving ? <Loader2Icon className="animate-spin" aria-hidden /> : <PlusIcon aria-hidden />}
          Crear
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}

/** Selector de varias etiquetas, con opción de crear una nueva al momento. */
export function LabelSelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { labels } = useWorkspace();
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Select multiple value={value} onValueChange={(next) => onChange(next as string[])}>
          <SelectTrigger id={id} className="min-w-0 flex-1" disabled={labels.length === 0}>
            <SelectValue className="min-w-0">
              {(selected: string[]) => {
                const chosen = labels.filter((label) => selected.includes(label.id));
                if (chosen.length === 0) {
                  return labels.length === 0 ? "No hay etiquetas todavía" : "Sin etiquetas";
                }
                return (
                  <span className="flex min-w-0 items-center gap-1 overflow-hidden">
                    {chosen.map((label) => (
                      <LabelChip key={label.id} label={label} className="shrink-0" />
                    ))}
                  </span>
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {labels.map((label) => (
              <SelectItem key={label.id} value={label.id}>
                <span className={cn("size-2.5 shrink-0 rounded-full", labelColor(label.color).dot)} />
                {label.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Crear etiqueta"
          title="Crear etiqueta"
          aria-expanded={creating}
          onClick={() => setCreating((current) => !current)}
        >
          <PlusIcon />
        </Button>
      </div>
      {creating && (
        <CreateLabelForm
          onCreated={(labelId) => {
            onChange([...value, labelId]);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
