import type { Database } from "@/lib/supabase/database.types";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type Project = Tables["projects"]["Row"];
export type Sprint = Tables["sprints"]["Row"];
export type Issue = Tables["issues"]["Row"];
export type IssueAssignee = Tables["issue_assignees"]["Row"];
export type Comment = Tables["comments"]["Row"];
export type Invitation = Tables["project_invitations"]["Row"];

export type ProjectRole = Enums["project_role"];
export type IssueType = Enums["issue_type"];
export type IssuePriority = Enums["issue_priority"];
export type IssueStatus = Enums["issue_status"];

export type Member = {
  user_id: string;
  rol: ProjectRole;
  nombre: string;
  avatar_url: string | null;
};

export const MEMBERS_SELECT = "user_id, rol, profiles(nombre, avatar_url)";

type MemberRow = {
  user_id: string;
  rol: ProjectRole;
  profiles: { nombre: string; avatar_url: string | null } | null;
};

export function toMember(row: MemberRow): Member {
  return {
    user_id: row.user_id,
    rol: row.rol,
    nombre: row.profiles?.nombre ?? "Usuario",
    avatar_url: row.profiles?.avatar_url ?? null,
  };
}
