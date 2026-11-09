"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { issueKey, priorityMeta, typeMeta } from "@/lib/issue-meta";
import type { Issue } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AssigneeAvatars } from "./assignee-avatars";
import { SubtaskProgress } from "./subtask-progress";
import { useWorkspace } from "./workspace-provider";

export function IssueCardContent({ issue, onOpen }: { issue: Issue; onOpen?: () => void }) {
  const { project, issueById, subtasksOf } = useWorkspace();
  const type = typeMeta(issue.tipo);
  const priority = priorityMeta(issue.prioridad);
  const key = issueKey(project.clave, issue);
  const parent = issue.parent_id ? issueById.get(issue.parent_id) : undefined;
  const subtasks = subtasksOf(issue.id);
  const done = subtasks.filter((subtask) => subtask.estado === "hecho").length;

  return (
    <>
      {parent && (
        <p className="mb-1 truncate text-xs text-muted-foreground" title={parent.titulo}>
          ↳ Subtarea de {issueKey(project.clave, parent)}
        </p>
      )}
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="line-clamp-3 w-full rounded-sm text-left text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {issue.titulo}
        </button>
      ) : (
        <p className="line-clamp-3 text-sm font-medium">{issue.titulo}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <span title={type.label}>
          <type.icon className={cn("size-4", type.className)} aria-label={type.label} />
        </span>
        <span title={`Prioridad ${priority.label.toLowerCase()}`}>
          <priority.icon
            className={cn("size-4", priority.className)}
            aria-label={`Prioridad ${priority.label.toLowerCase()}`}
          />
        </span>
        <span className="text-xs text-muted-foreground">{key}</span>
        {subtasks.length > 0 && <SubtaskProgress done={done} total={subtasks.length} />}
        <span className="ml-auto">
          <AssigneeAvatars issueId={issue.id} />
        </span>
      </div>
    </>
  );
}

export function SortableIssueCard({ issue, onOpen }: { issue: Issue; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "cursor-grab touch-manipulation rounded-lg border bg-card p-3 shadow-xs select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isDragging && "opacity-40",
      )}
      {...attributes}
      {...listeners}
    >
      <IssueCardContent issue={issue} onOpen={onOpen} />
    </li>
  );
}
