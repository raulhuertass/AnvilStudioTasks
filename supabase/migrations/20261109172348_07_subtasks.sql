-- Subtareas: tareas con una tarea padre del mismo proyecto. Un solo nivel.

alter table public.issues add column parent_id uuid;
alter table public.issues
  add constraint issues_parent_id_project_id_fkey
  foreign key (parent_id, project_id) references public.issues (id, project_id) on delete cascade;
alter table public.issues
  add constraint issues_parent_not_self check (parent_id is null or parent_id <> id);
create index issues_parent_id_idx on public.issues (parent_id);

-- El padre se elige al crear la subtarea y no cambia después.
grant insert (parent_id) on public.issues to authenticated;

-- La subtarea vive siempre en el mismo sprint que su padre.
create function private.sync_subtask_sprint()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_parent record;
begin
  if new.parent_id is null then
    return new;
  end if;

  select i.parent_id, i.sprint_id into v_parent
  from public.issues i where i.id = new.parent_id;

  if v_parent.parent_id is not null then
    raise exception 'Una subtarea no puede tener subtareas' using errcode = 'P0001';
  end if;

  new.sprint_id := v_parent.sprint_id;
  return new;
end;
$$;

create trigger sync_subtask_sprint
  before insert or update of sprint_id on public.issues
  for each row execute function private.sync_subtask_sprint();

-- Al mover el padre de sprint (o al backlog), sus subtareas lo acompañan.
create function private.move_subtasks_with_parent()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.issues
    set sprint_id = new.sprint_id
    where parent_id = new.id and sprint_id is distinct from new.sprint_id;
  return null;
end;
$$;

create trigger move_subtasks_with_parent
  after update of sprint_id on public.issues
  for each row
  when (old.sprint_id is distinct from new.sprint_id)
  execute function private.move_subtasks_with_parent();

revoke all on function private.sync_subtask_sprint() from public;
revoke all on function private.move_subtasks_with_parent() from public;
