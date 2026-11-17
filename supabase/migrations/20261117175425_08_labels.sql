-- Etiquetas por proyecto y su relación con las tareas.

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 40),
  color text not null default 'gris'
    check (color in ('gris', 'rojo', 'naranja', 'amarillo', 'verde', 'azul', 'morado', 'rosa')),
  created_at timestamptz not null default now(),
  -- Permite que issue_labels referencie (label_id, project_id).
  unique (id, project_id)
);
-- Sin nombres repetidos dentro de un proyecto, sin distinguir mayúsculas.
create unique index labels_project_nombre_key on public.labels (project_id, lower(trim(nombre)));

create table public.issue_labels (
  issue_id uuid not null,
  label_id uuid not null,
  project_id uuid not null,
  primary key (issue_id, label_id),
  foreign key (issue_id, project_id)
    references public.issues (id, project_id) on delete cascade,
  foreign key (label_id, project_id)
    references public.labels (id, project_id) on delete cascade
);
create index issue_labels_label_idx on public.issue_labels (label_id, project_id);
create index issue_labels_project_idx on public.issue_labels (project_id);

alter table public.labels enable row level security;
alter table public.issue_labels enable row level security;
revoke all on public.labels, public.issue_labels from anon, authenticated;

grant select, delete on public.labels to authenticated;
grant insert (project_id, nombre, color) on public.labels to authenticated;
grant update (nombre, color) on public.labels to authenticated;
grant select, delete on public.issue_labels to authenticated;
grant insert (issue_id, label_id, project_id) on public.issue_labels to authenticated;

create policy "Ver etiquetas" on public.labels
  for select to authenticated using (private.is_project_member(project_id));
create policy "Crear etiquetas" on public.labels
  for insert to authenticated with check (private.is_project_member(project_id));
create policy "Editar etiquetas" on public.labels
  for update to authenticated
  using (private.is_project_member(project_id)) with check (private.is_project_member(project_id));
create policy "Borrar etiquetas" on public.labels
  for delete to authenticated using (private.is_project_member(project_id));

create policy "Ver etiquetas de tareas" on public.issue_labels
  for select to authenticated using (private.is_project_member(project_id));
create policy "Etiquetar tareas" on public.issue_labels
  for insert to authenticated with check (private.is_project_member(project_id));
create policy "Quitar etiquetas de tareas" on public.issue_labels
  for delete to authenticated using (private.is_project_member(project_id));

alter publication supabase_realtime add table public.labels, public.issue_labels;
