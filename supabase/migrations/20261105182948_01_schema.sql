-- Tipos, tablas e índices del gestor de tareas.

create type public.project_role as enum ('admin', 'miembro');
create type public.sprint_status as enum ('planificado', 'activo', 'cerrado');
create type public.issue_type as enum ('bug', 'tarea', 'historia', 'epica');
create type public.issue_priority as enum ('mas_alta', 'alta', 'media', 'baja');
create type public.issue_status as enum ('por_hacer', 'en_curso', 'en_revision', 'hecho');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 100),
  avatar_url text
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 1 and 100),
  clave text not null check (clave ~ '^[A-Z][A-Z0-9]{1,9}$'),
  descripcion text,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Último número de issue asignado; lo mantiene un trigger.
  issue_counter integer not null default 0,
  created_at timestamptz not null default now(),
  unique (owner_id, clave)
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rol public.project_role not null default 'miembro',
  primary key (project_id, user_id)
);
create index project_members_user_id_idx on public.project_members (user_id);

-- Invitaciones a emails que todavía no tienen cuenta confirmada.
create table public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  email text not null check (email = lower(trim(email))),
  rol public.project_role not null default 'miembro',
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, email)
);
create index project_invitations_email_idx on public.project_invitations (email);
create index project_invitations_invited_by_idx on public.project_invitations (invited_by);

create table public.sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 100),
  fecha_inicio date,
  fecha_fin date,
  estado public.sprint_status not null default 'planificado',
  -- Permite que issues referencie (sprint_id, project_id).
  unique (id, project_id),
  check (fecha_fin is null or fecha_inicio is null or fecha_fin >= fecha_inicio)
);
create index sprints_project_id_idx on public.sprints (project_id);
-- Como mucho un sprint activo por proyecto.
create unique index sprints_one_active_per_project
  on public.sprints (project_id) where estado = 'activo';

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  numero integer not null,
  titulo text not null check (char_length(trim(titulo)) between 1 and 255),
  descripcion text,
  tipo public.issue_type not null default 'tarea',
  prioridad public.issue_priority not null default 'media',
  estado public.issue_status not null default 'por_hacer',
  assignee_id uuid,
  reporter_id uuid references public.profiles (id) on delete set null,
  sprint_id uuid,
  posicion double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, numero),
  -- El sprint y el asignado deben pertenecer al mismo proyecto.
  foreign key (sprint_id, project_id)
    references public.sprints (id, project_id) on delete set null (sprint_id),
  foreign key (project_id, assignee_id)
    references public.project_members (project_id, user_id) on delete set null (assignee_id)
);
create index issues_board_idx on public.issues (project_id, sprint_id, estado, posicion);
create index issues_sprint_id_idx on public.issues (sprint_id);
create index issues_assignee_id_idx on public.issues (assignee_id);
create index issues_reporter_id_idx on public.issues (reporter_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  autor_id uuid default auth.uid() references public.profiles (id) on delete set null,
  contenido text not null check (char_length(trim(contenido)) between 1 and 10000),
  created_at timestamptz not null default now()
);
create index comments_issue_id_idx on public.comments (issue_id, created_at);
create index comments_autor_id_idx on public.comments (autor_id);
