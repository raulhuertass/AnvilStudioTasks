-- Varias personas asignadas a una misma tarea.

-- Permite que issue_assignees referencie (issue_id, project_id).
alter table public.issues add constraint issues_id_project_id_key unique (id, project_id);

create table public.issue_assignees (
  issue_id uuid not null,
  user_id uuid not null,
  -- Garantiza que la persona sea miembro del proyecto de la tarea y permite
  -- filtrar por proyecto en Realtime.
  project_id uuid not null,
  primary key (issue_id, user_id),
  foreign key (issue_id, project_id)
    references public.issues (id, project_id) on delete cascade,
  foreign key (project_id, user_id)
    references public.project_members (project_id, user_id) on delete cascade
);
create index issue_assignees_project_user_idx on public.issue_assignees (project_id, user_id);

alter table public.issue_assignees enable row level security;
revoke all on public.issue_assignees from anon, authenticated;
grant select, delete on public.issue_assignees to authenticated;
grant insert (issue_id, user_id, project_id) on public.issue_assignees to authenticated;

create policy "Ver asignaciones" on public.issue_assignees
  for select to authenticated using (private.is_project_member(project_id));
create policy "Crear asignaciones" on public.issue_assignees
  for insert to authenticated with check (private.is_project_member(project_id));
create policy "Borrar asignaciones" on public.issue_assignees
  for delete to authenticated using (private.is_project_member(project_id));

insert into public.issue_assignees (issue_id, user_id, project_id)
select id, assignee_id, project_id from public.issues where assignee_id is not null;

alter publication supabase_realtime add table public.issue_assignees;
