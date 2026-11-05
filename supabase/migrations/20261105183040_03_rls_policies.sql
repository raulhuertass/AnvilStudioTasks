-- Row Level Security y permisos por columna.
-- anon no tiene acceso a nada; authenticated solo a lo que necesita la app.

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invitations enable row level security;
alter table public.sprints enable row level security;
alter table public.issues enable row level security;
alter table public.comments enable row level security;

revoke all on public.profiles, public.projects, public.project_members,
  public.project_invitations, public.sprints, public.issues, public.comments
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (nombre, avatar_url) on public.profiles to authenticated;

grant select, delete on public.projects to authenticated;
grant insert (nombre, clave, descripcion, owner_id) on public.projects to authenticated;
grant update (nombre, descripcion) on public.projects to authenticated;

grant select, delete on public.project_members to authenticated;
grant update (rol) on public.project_members to authenticated;

grant select, delete on public.project_invitations to authenticated;

-- El estado del sprint solo cambia con start_sprint y close_sprint.
grant select, delete on public.sprints to authenticated;
grant insert (project_id, nombre, fecha_inicio, fecha_fin) on public.sprints to authenticated;
grant update (nombre, fecha_inicio, fecha_fin) on public.sprints to authenticated;

grant select, delete on public.issues to authenticated;
grant insert (project_id, titulo, descripcion, tipo, prioridad, estado, assignee_id, sprint_id, posicion)
  on public.issues to authenticated;
grant update (titulo, descripcion, tipo, prioridad, estado, assignee_id, sprint_id, posicion)
  on public.issues to authenticated;

grant select, delete on public.comments to authenticated;
grant insert (issue_id, contenido, autor_id) on public.comments to authenticated;
grant update (contenido) on public.comments to authenticated;

-- profiles
create policy "Ver mi profile y el de mis compañeros" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.shares_project_with(id));
create policy "Editar mi profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- projects (owner_id en select: al crear, el RETURNING se evalúa antes del
-- trigger que añade al propietario como miembro)
create policy "Ver proyectos propios o donde soy miembro" on public.projects
  for select to authenticated
  using (owner_id = (select auth.uid()) or private.is_project_member(id));
create policy "Crear proyectos propios" on public.projects
  for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "Los admins editan el proyecto" on public.projects
  for update to authenticated
  using (private.is_project_admin(id)) with check (private.is_project_admin(id));
create policy "El propietario borra el proyecto" on public.projects
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- project_members (las altas pasan por invite_project_member)
create policy "Ver miembros de mis proyectos" on public.project_members
  for select to authenticated
  using (private.is_project_member(project_id));
create policy "Los admins cambian roles" on public.project_members
  for update to authenticated
  using (private.is_project_admin(project_id)) with check (private.is_project_admin(project_id));
create policy "Los admins expulsan y cada uno puede salir" on public.project_members
  for delete to authenticated
  using (user_id = (select auth.uid()) or private.is_project_admin(project_id));

-- project_invitations
create policy "Los admins ven invitaciones" on public.project_invitations
  for select to authenticated
  using (private.is_project_admin(project_id));
create policy "Los admins cancelan invitaciones" on public.project_invitations
  for delete to authenticated
  using (private.is_project_admin(project_id));

-- sprints
create policy "Ver sprints" on public.sprints
  for select to authenticated using (private.is_project_member(project_id));
create policy "Crear sprints" on public.sprints
  for insert to authenticated with check (private.is_project_member(project_id));
create policy "Editar sprints" on public.sprints
  for update to authenticated
  using (private.is_project_member(project_id)) with check (private.is_project_member(project_id));
create policy "Borrar sprints" on public.sprints
  for delete to authenticated using (private.is_project_member(project_id));

-- issues
create policy "Ver issues" on public.issues
  for select to authenticated using (private.is_project_member(project_id));
create policy "Crear issues" on public.issues
  for insert to authenticated with check (private.is_project_member(project_id));
create policy "Editar issues" on public.issues
  for update to authenticated
  using (private.is_project_member(project_id)) with check (private.is_project_member(project_id));
create policy "Borrar issues" on public.issues
  for delete to authenticated using (private.is_project_member(project_id));

-- comments
create policy "Ver comentarios" on public.comments
  for select to authenticated using (private.is_issue_member(issue_id));
create policy "Comentar como yo mismo" on public.comments
  for insert to authenticated
  with check (autor_id = (select auth.uid()) and private.is_issue_member(issue_id));
create policy "Editar mis comentarios" on public.comments
  for update to authenticated
  using (autor_id = (select auth.uid()) and private.is_issue_member(issue_id))
  with check (autor_id = (select auth.uid()) and private.is_issue_member(issue_id));
create policy "Borrar mis comentarios o, si soy admin, cualquiera" on public.comments
  for delete to authenticated
  using (
    (autor_id = (select auth.uid()) and private.is_issue_member(issue_id))
    or private.is_issue_admin(issue_id)
  );
