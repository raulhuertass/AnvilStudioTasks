-- Operaciones que cruzan varias filas y publicación de Realtime.

-- Invita por email: si ya hay cuenta confirmada añade al miembro; si no, deja
-- una invitación que se aplicará al confirmar ese email.
create function public.invite_project_member(
  p_project_id uuid,
  p_email text,
  p_rol public.project_role default 'miembro'
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_user_id uuid;
begin
  if not private.is_project_admin(p_project_id) then
    raise exception 'Solo los administradores pueden invitar miembros' using errcode = '42501';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'El email no es válido' using errcode = '22023';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = v_email and u.email_confirmed_at is not null;

  if v_user_id is not null then
    if exists (
      select 1 from public.project_members m
      where m.project_id = p_project_id and m.user_id = v_user_id
    ) then
      return 'ya_miembro';
    end if;
    insert into public.project_members (project_id, user_id, rol)
    values (p_project_id, v_user_id, p_rol);
    return 'anadido';
  end if;

  insert into public.project_invitations (project_id, email, rol, invited_by)
  values (p_project_id, v_email, p_rol, auth.uid())
  on conflict (project_id, email) do update set rol = excluded.rol;
  return 'invitado';
end;
$$;

create function public.start_sprint(p_sprint_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_project_id uuid;
  v_estado public.sprint_status;
begin
  select s.project_id, s.estado into v_project_id, v_estado
  from public.sprints s where s.id = p_sprint_id;

  if v_project_id is null or not private.is_project_member(v_project_id) then
    raise exception 'Sprint no encontrado' using errcode = 'P0002';
  end if;
  if v_estado <> 'planificado' then
    raise exception 'Solo se puede iniciar un sprint planificado' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.sprints s where s.project_id = v_project_id and s.estado = 'activo'
  ) then
    raise exception 'Ya hay un sprint activo en este proyecto' using errcode = 'P0001';
  end if;

  update public.sprints
    set estado = 'activo', fecha_inicio = coalesce(fecha_inicio, current_date)
    where id = p_sprint_id;
end;
$$;

-- Cierra el sprint: lo no terminado vuelve al backlog y lo hecho queda en él.
create function public.close_sprint(p_sprint_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_project_id uuid;
  v_estado public.sprint_status;
  v_moved integer;
begin
  select s.project_id, s.estado into v_project_id, v_estado
  from public.sprints s where s.id = p_sprint_id;

  if v_project_id is null or not private.is_project_member(v_project_id) then
    raise exception 'Sprint no encontrado' using errcode = 'P0002';
  end if;
  if v_estado <> 'activo' then
    raise exception 'Solo se puede cerrar un sprint activo' using errcode = 'P0001';
  end if;

  update public.issues
    set sprint_id = null
    where sprint_id = p_sprint_id and estado <> 'hecho';
  get diagnostics v_moved = row_count;

  update public.sprints
    set estado = 'cerrado', fecha_fin = coalesce(fecha_fin, current_date)
    where id = p_sprint_id;

  return v_moved;
end;
$$;

revoke all on function public.invite_project_member(uuid, text, public.project_role) from public, anon;
revoke all on function public.start_sprint(uuid) from public, anon;
revoke all on function public.close_sprint(uuid) from public, anon;
grant execute on function public.invite_project_member(uuid, text, public.project_role) to authenticated;
grant execute on function public.start_sprint(uuid) to authenticated;
grant execute on function public.close_sprint(uuid) to authenticated;

alter publication supabase_realtime add table
  public.issues, public.sprints, public.comments, public.project_members;
