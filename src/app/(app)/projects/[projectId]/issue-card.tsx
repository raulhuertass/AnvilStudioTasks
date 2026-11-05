"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UserAvatar } from "@/components/user-avatar";
import { issueKey, priorityMeta, typeMeta } from "@/lib/issue-meta";
import type { Issue } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./workspace-provider";

export function IssueCardContent({ issue, onOpen }: { issue: Issue; onOpen?: () => void }) {
  const { project, members } = useWorkspace();
  const type = typeMeta(issue.tipo);
  const priority = priorityMeta(issue.prioridad);
  const assignee = members.find((member) => member.user_id === issue.assignee_id);
  const key = issueKey(project.clave, issue);

  return (
    <>
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
        <span className="ml-auto" title={assignee ? assignee.nombre : "Sin asignar"}>
          {assignee ? (
            <UserAvatar nombre={assignee.nombre} avatarUrl={assignee.avatar_url} className="size-6" />
          ) : (
            <span className="block size-6 rounded-full border border-dashed" aria-label="Sin asignar" />
          )}
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
