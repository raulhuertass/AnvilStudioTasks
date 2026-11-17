"use client";

import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { FieldSelect } from "@/components/field-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Label } from "@/lib/types";
import { LabelChip } from "../label-chips";
import { COLOR_OPTIONS, CreateLabelForm } from "../label-select";
import { useWorkspace } from "../workspace-provider";

function LabelRow({ label, uses }: { label: Label; uses: number }) {
  const { updateLabel, deleteLabel } = useWorkspace();
  // null = sin editar: se muestra el nombre guardado, que puede cambiar en tiempo real.
  const [draft, setDraft] = useState<string | null>(null);

  async function saveName() {
    if (draft === null) return;
    const nombre = draft.trim();
    setDraft(null);
    if (nombre && nombre !== label.nombre) await updateLabel(label.id, { nombre });
  }

  return (
    <li className="flex flex-wrap items-center gap-2 p-3">
      <LabelChip label={{ ...label, nombre: draft?.trim() || label.nombre }} className="w-24 justify-center" />
      <Input
        aria-label={`Nombre de la etiqueta ${label.nombre}`}
        maxLength={40}
        className="min-w-32 flex-1"
        value={draft ?? label.nombre}
        onFocus={() => setDraft(label.nombre)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={saveName}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
      <FieldSelect
        label={`Color de la etiqueta ${label.nombre}`}
        className="w-32"
        value={label.color}
        options={COLOR_OPTIONS}
        onChange={(color) => updateLabel(label.id, { color })}
      />
      <span className="w-20 text-right text-xs text-muted-foreground tabular-nums">
        {uses} {uses === 1 ? "tarea" : "tareas"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Eliminar la etiqueta ${label.nombre}`}
        title="Eliminar etiqueta"
        onClick={() => {
          const warning = uses > 0 ? ` Se quitará de ${uses === 1 ? "1 tarea" : `${uses} tareas`}.` : "";
          if (window.confirm(`¿Eliminar la etiqueta «${label.nombre}»?${warning}`)) deleteLabel(label.id);
        }}
      >
        <Trash2Icon />
      </Button>
    </li>
  );
}

export default function LabelsPage() {
  const { labels, issueLabels } = useWorkspace();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 sm:p-6">
      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Nueva etiqueta</h2>
        <CreateLabelForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Etiquetas del proyecto ({labels.length})</h2>
        {labels.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            Aún no hay etiquetas. Crea la primera arriba o desde el detalle de una tarea.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {labels.map((label) => (
              <LabelRow
                key={label.id}
                label={label}
                uses={issueLabels.filter((item) => item.label_id === label.id).length}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
