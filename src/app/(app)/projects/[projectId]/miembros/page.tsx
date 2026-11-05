"use client";

import { Loader2Icon, MailIcon, Trash2Icon, UserMinusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { ProjectRole } from "@/lib/types";
import { DeleteProjectSection } from "../delete-project-section";
import { useWorkspace } from "../workspace-provider";

const ROLE_ITEMS = [
  { value: "miembro", label: "Miembro" },
  { value: "admin", label: "Administrador" },
];

const INVITE_RESULT: Record<string, string> = {
  anadido: "Miembro añadido al proyecto.",
  ya_miembro: "Esa persona ya es miembro del proyecto.",
  invitado: "Invitación guardada: entrará en el proyecto al registrarse con ese email.",
};

function RoleSelect({
  value,
  onChange,
  id,
  label,
}: {
  value: ProjectRole;
  onChange: (rol: ProjectRole) => void;
  id?: string;
  label?: string;
}) {
  return (
    <Select items={ROLE_ITEMS} value={value} onValueChange={(next) => next && onChange(next as ProjectRole)}>
      <SelectTrigger id={id} aria-label={label} className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function MembersPage() {
  const router = useRouter();
  const { project, currentUserId, members, invitations, isAdmin, refreshMembers } = useWorkspace();
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<ProjectRole>("miembro");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function invite(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInviting(true);
    const { data, error: rpcError } = await createClient().rpc("invite_project_member", {
      p_project_id: project.id,
      p_email: email,
      p_rol: rol,
    });
    setInviting(false);
    if (rpcError) {
      setError(friendlyError(rpcError, "No se ha podido enviar la invitación."));
      return;
    }
    toast.success(INVITE_RESULT[data] ?? "Hecho.");
    setEmail("");
    await refreshMembers();
  }

  async function changeRole(userId: string, nextRole: ProjectRole) {
    const { error: updateError } = await createClient()
      .from("project_members")
      .update({ rol: nextRole })
      .eq("project_id", project.id)
      .eq("user_id", userId);
    if (updateError) toast.error(friendlyError(updateError));
    await refreshMembers();
  }

  async function removeMember(userId: string) {
    const leaving = userId === currentUserId;
    const question = leaving ? "¿Salir de este proyecto?" : "¿Quitar a esta persona del proyecto?";
    if (!window.confirm(question)) return;
    const { error: deleteError } = await createClient()
      .from("project_members")
      .delete()
      .eq("project_id", project.id)
      .eq("user_id", userId);
    if (deleteError) {
      toast.error(friendlyError(deleteError));
      return;
    }
    if (leaving) {
      router.push("/projects");
      return;
    }
    await refreshMembers();
  }

  async function cancelInvitation(id: string) {
    const { error: deleteError } = await createClient()
      .from("project_invitations")
      .delete()
      .eq("id", id);
    if (deleteError) toast.error(friendlyError(deleteError));
    await refreshMembers();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 sm:p-6">
      {isAdmin && (
        <form onSubmit={invite} className="flex flex-col gap-3">
          <h2 className="font-medium">Invitar por email</h2>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-rol">Rol</Label>
              <RoleSelect id="invite-rol" value={rol} onChange={setRol} />
            </div>
            <Button type="submit" disabled={inviting}>
              {inviting ? <Loader2Icon className="animate-spin" aria-hidden /> : <MailIcon aria-hidden />}
              Invitar
            </Button>
          </div>
        </form>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Miembros ({members.length})</h2>
        <ul className="divide-y rounded-xl border">
          {members.map((member) => {
            const isOwner = member.user_id === project.owner_id;
            const isMe = member.user_id === currentUserId;
            return (
              <li key={member.user_id} className="flex flex-wrap items-center gap-3 p-3">
                <UserAvatar nombre={member.nombre} avatarUrl={member.avatar_url} />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {member.nombre}
                  {isMe && <span className="text-muted-foreground"> (tú)</span>}
                </span>
                {isOwner && <Badge variant="secondary">Propietario</Badge>}
                {isAdmin && !isOwner ? (
                  <RoleSelect
                    label={`Rol de ${member.nombre}`}
                    value={member.rol}
                    onChange={(next) => changeRole(member.user_id, next)}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {member.rol === "admin" ? "Administrador" : "Miembro"}
                  </span>
                )}
                {!isOwner && (isAdmin || isMe) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={isMe ? "Salir del proyecto" : `Quitar a ${member.nombre}`}
                    title={isMe ? "Salir del proyecto" : `Quitar a ${member.nombre}`}
                    onClick={() => removeMember(member.user_id)}
                  >
                    <UserMinusIcon />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {isAdmin && invitations.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium">Invitaciones pendientes ({invitations.length})</h2>
          <ul className="divide-y rounded-xl border">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex items-center gap-3 p-3">
                <span className="min-w-0 flex-1 truncate text-sm">{invitation.email}</span>
                <span className="text-sm text-muted-foreground">
                  {invitation.rol === "admin" ? "Administrador" : "Miembro"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Cancelar la invitación a ${invitation.email}`}
                  title="Cancelar invitación"
                  onClick={() => cancelInvitation(invitation.id)}
                >
                  <Trash2Icon />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DeleteProjectSection />
    </main>
  );
}
