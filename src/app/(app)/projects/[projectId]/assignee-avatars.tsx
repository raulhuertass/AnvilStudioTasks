"use client";

import { UserAvatar } from "@/components/user-avatar";
import { useWorkspace } from "./workspace-provider";

const MAX_VISIBLE = 3;

/** Avatares superpuestos de las personas asignadas a una tarea. */
export function AssigneeAvatars({ issueId }: { issueId: string }) {
  const { members, assigneeIdsOf } = useWorkspace();
  const assignees = members.filter((member) => assigneeIdsOf(issueId).includes(member.user_id));

  if (assignees.length === 0) {
    return (
      <span title="Sin asignar">
        <span className="block size-6 rounded-full border border-dashed" aria-label="Sin asignar" />
      </span>
    );
  }

  const names = assignees.map((member) => member.nombre).join(", ");
  const hidden = assignees.length - MAX_VISIBLE;

  return (
    <span className="flex items-center -space-x-1.5" title={names} aria-label={`Asignada a ${names}`}>
      {assignees.slice(0, MAX_VISIBLE).map((member) => (
        <UserAvatar
          key={member.user_id}
          nombre={member.nombre}
          avatarUrl={member.avatar_url}
          className="size-6 ring-2 ring-card"
        />
      ))}
      {hidden > 0 && (
        <span className="z-10 flex size-6 items-center justify-center rounded-full bg-muted text-[0.65rem] font-medium ring-2 ring-card">
          +{hidden}
        </span>
      )}
    </span>
  );
}
