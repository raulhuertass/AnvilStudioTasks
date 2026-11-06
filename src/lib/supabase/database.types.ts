// Generado desde el esquema de Supabase. Ajuste manual: en issues.Insert, numero
// y posicion son opcionales porque los rellena el trigger prepare_new_issue.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      comments: {
        Row: {
          autor_id: string | null;
          contenido: string;
          created_at: string;
          id: string;
          issue_id: string;
        };
        Insert: {
          autor_id?: string | null;
          contenido: string;
          created_at?: string;
          id?: string;
          issue_id: string;
        };
        Update: {
          autor_id?: string | null;
          contenido?: string;
          created_at?: string;
          id?: string;
          issue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "issues";
            referencedColumns: ["id"];
          },
        ];
      };
      issue_assignees: {
        Row: {
          issue_id: string;
          project_id: string;
          user_id: string;
        };
        Insert: {
          issue_id: string;
          project_id: string;
          user_id: string;
        };
        Update: {
          issue_id?: string;
          project_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "issue_assignees_issue_id_project_id_fkey";
            columns: ["issue_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "issues";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "issue_assignees_project_id_user_id_fkey";
            columns: ["project_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "project_members";
            referencedColumns: ["project_id", "user_id"];
          },
        ];
      };
      issues: {
        Row: {
          created_at: string;
          descripcion: string | null;
          estado: Database["public"]["Enums"]["issue_status"];
          id: string;
          numero: number;
          posicion: number;
          prioridad: Database["public"]["Enums"]["issue_priority"];
          project_id: string;
          reporter_id: string | null;
          sprint_id: string | null;
          tipo: Database["public"]["Enums"]["issue_type"];
          titulo: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["issue_status"];
          id?: string;
          numero?: number;
          posicion?: number;
          prioridad?: Database["public"]["Enums"]["issue_priority"];
          project_id: string;
          reporter_id?: string | null;
          sprint_id?: string | null;
          tipo?: Database["public"]["Enums"]["issue_type"];
          titulo: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["issue_status"];
          id?: string;
          numero?: number;
          posicion?: number;
          prioridad?: Database["public"]["Enums"]["issue_priority"];
          project_id?: string;
          reporter_id?: string | null;
          sprint_id?: string | null;
          tipo?: Database["public"]["Enums"]["issue_type"];
          titulo?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "issues_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issues_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issues_sprint_id_project_id_fkey";
            columns: ["sprint_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "sprints";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          id: string;
          nombre: string;
        };
        Insert: {
          avatar_url?: string | null;
          id: string;
          nombre: string;
        };
        Update: {
          avatar_url?: string | null;
          id?: string;
          nombre?: string;
        };
        Relationships: [];
      };
      project_invitations: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          invited_by: string | null;
          project_id: string;
          rol: Database["public"]["Enums"]["project_role"];
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          invited_by?: string | null;
          project_id: string;
          rol?: Database["public"]["Enums"]["project_role"];
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          invited_by?: string | null;
          project_id?: string;
          rol?: Database["public"]["Enums"]["project_role"];
        };
        Relationships: [
          {
            foreignKeyName: "project_invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_invitations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_members: {
        Row: {
          project_id: string;
          rol: Database["public"]["Enums"]["project_role"];
          user_id: string;
        };
        Insert: {
          project_id: string;
          rol?: Database["public"]["Enums"]["project_role"];
          user_id: string;
        };
        Update: {
          project_id?: string;
          rol?: Database["public"]["Enums"]["project_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          clave: string;
          created_at: string;
          descripcion: string | null;
          id: string;
          issue_counter: number;
          nombre: string;
          owner_id: string;
        };
        Insert: {
          clave: string;
          created_at?: string;
          descripcion?: string | null;
          id?: string;
          issue_counter?: number;
          nombre: string;
          owner_id?: string;
        };
        Update: {
          clave?: string;
          created_at?: string;
          descripcion?: string | null;
          id?: string;
          issue_counter?: number;
          nombre?: string;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sprints: {
        Row: {
          estado: Database["public"]["Enums"]["sprint_status"];
          fecha_fin: string | null;
          fecha_inicio: string | null;
          id: string;
          nombre: string;
          project_id: string;
        };
        Insert: {
          estado?: Database["public"]["Enums"]["sprint_status"];
          fecha_fin?: string | null;
          fecha_inicio?: string | null;
          id?: string;
          nombre: string;
          project_id: string;
        };
        Update: {
          estado?: Database["public"]["Enums"]["sprint_status"];
          fecha_fin?: string | null;
          fecha_inicio?: string | null;
          id?: string;
          nombre?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sprints_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      close_sprint: { Args: { p_sprint_id: string }; Returns: number };
      invite_project_member: {
        Args: {
          p_email: string;
          p_project_id: string;
          p_rol?: Database["public"]["Enums"]["project_role"];
        };
        Returns: string;
      };
      start_sprint: { Args: { p_sprint_id: string }; Returns: undefined };
    };
    Enums: {
      issue_priority: "mas_alta" | "alta" | "media" | "baja";
      issue_status: "por_hacer" | "en_curso" | "en_revision" | "hecho";
      issue_type: "bug" | "tarea" | "historia" | "epica";
      project_role: "admin" | "miembro";
      sprint_status: "planificado" | "activo" | "cerrado";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
