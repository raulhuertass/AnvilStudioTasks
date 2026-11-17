"use client";

import { labelColor } from "@/lib/labels";
import type { Label } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./workspace-provider";

export function LabelChip({ label, className }: { label: Label; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-36 items-center truncate rounded-md px-1.5 py-0.5 text-[0.7rem] leading-tight font-medium",
        labelColor(label.color).chip,
        className,
      )}
      title={label.nombre}
    >
      {label.nombre}
    </span>
  );
}

/** Etiquetas de una tarea, recortadas a `max` con un contador del resto. */
export function IssueLabelChips({ issueId, max = 3 }: { issueId: string; max?: number }) {
  const labels = useWorkspace().labelsOf(issueId);
  if (labels.length === 0) return null;
  const hidden = labels.length - max;

  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      {labels.slice(0, max).map((label) => (
        <LabelChip key={label.id} label={label} />
      ))}
      {hidden > 0 && (
        <span
          className="text-[0.7rem] text-muted-foreground"
          title={labels.slice(max).map((label) => label.nombre).join(", ")}
        >
          +{hidden}
        </span>
      )}
    </span>
  );
}
