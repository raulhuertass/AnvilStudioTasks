"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";
import { useWorkspace } from "./workspace-provider";

/** Selector de varias personas: la lista sigue abierta al marcar cada una. */
export function AssigneeSelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const members = [...useWorkspace().members].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  function summary(selected: string[]) {
    const chosen = members.filter((member) => selected.includes(member.user_id));
    if (chosen.length === 0) return "Sin asignar";
    return (
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex shrink-0 items-center -space-x-1.5">
          {chosen.slice(0, 3).map((member) => (
            <UserAvatar
              key={member.user_id}
              nombre={member.nombre}
              avatarUrl={member.avatar_url}
              className="size-5 ring-1 ring-background"
            />
          ))}
        </span>
        <span className="truncate">{chosen.map((member) => member.nombre).join(", ")}</span>
      </span>
    );
  }

  return (
    <Select multiple value={value} onValueChange={(next) => onChange(next as string[])}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue className="min-w-0">{(selected: string[]) => summary(selected)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {members.map((member) => (
          <SelectItem key={member.user_id} value={member.user_id}>
            <UserAvatar nombre={member.nombre} avatarUrl={member.avatar_url} className="size-5" />
            {member.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
