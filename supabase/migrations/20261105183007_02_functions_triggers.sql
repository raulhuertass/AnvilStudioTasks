-- Funciones auxiliares (en un esquema no expuesto por la API) y triggers.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_project_member(p_project_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = p_project_id and m.user_id = auth.uid()
  );
$$;

create function private.is_project_admin(p_project_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = p_project_id and m.user_id = auth.uid() and m.rol = 'admin'
  );
$$;

create function private.is_issue_member(p_issue_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.issues i
    join public.project_members m on m.project_id = i.project_id
    where i.id = p_issue_id and m.user_id = auth.uid()
  );
$$;

create function private.is_issue_admin(p_issue_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.issues i
    join public.project_members m on m.project_id = i.project_id
    where i.id = p_issue_id and m.user_id = auth.uid() and m.rol = 'admin'
  );
$$;

create function private.shares_project_with(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.project_members mine
    join public.project_members theirs on theirs.project_id = mine.project_id
    where mine.user_id = auth.uid() and theirs.user_id = p_user_id
  );
$$;

revoke all on function private.is_project_member(uuid) from public;
revoke all on function private.is_project_admin(uuid) from public;
revoke all on function private.is_issue_member(uuid) from public;
revoke all on function private.is_issue_admin(uuid) from public;
revoke all on function private.shares_project_with(uuid) from public;
grant execute on function private.is_project_member(uuid) to authenticated;
grant execute on function private.is_project_admin(uuid) to authenticated;
grant execute on function private.is_issue_member(uuid) to authenticated;
grant execute on function private.is_issue_admin(uuid) to authenticated;
grant execute on function private.shares_project_with(uuid) to authenticated;

-- Crea el profile al registrarse un usuario.
create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nombre, avatar_url)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1), 'Usuario'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Convierte las invitaciones pendientes en membresías solo cuando el email
-- está confirmado, para que nadie las reclame registrándose con un email ajeno.
create function private.claim_invitations()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is null or new.email is null then
    return new;
  end if;

  insert into public.project_members (project_id, user_id, rol)
  select i.project_id, new.id, i.rol
  from public.project_invitations i
  where i.email = lower(new.email)
  on conflict do nothing;

  delete from public.project_invitations i where i.email = lower(new.email);
  return new;
end;
$$;

create trigger on_auth_user_confirmed
  after insert or update of email_confirmed_at, email on auth.users
  for each row execute function private.claim_invitations();

-- El creador de un proyecto entra como admin.
create function private.add_owner_as_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.project_members (project_id, user_id, rol)
  values (new.id, new.owner_id, 'admin');
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function private.add_owner_as_admin();

-- El propietario no puede dejar el proyecto ni perder el rol de admin.
create function private.protect_project_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.projects p
    where p.id = old.project_id and p.owner_id = old.user_id
  ) and (tg_op = 'DELETE' or new.rol <> 'admin') then
    raise exception 'El propietario del proyecto debe seguir siendo administrador'
      using errcode = 'P0001';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger protect_project_owner
  before update or delete on public.project_members
  for each row execute function private.protect_project_owner();

-- Asigna número por proyecto (atómico: la fila del proyecto queda bloqueada),
-- informador y posición final por defecto.
create function private.prepare_new_issue()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.projects
    set issue_counter = issue_counter + 1
    where id = new.project_id
    returning issue_counter into new.numero;

  new.reporter_id := coalesce(auth.uid(), new.reporter_id);

  if new.posicion is null then
    select coalesce(max(i.posicion), 0) + 1024 into new.posicion
    from public.issues i
    where i.project_id = new.project_id and i.estado = new.estado;
  end if;

  return new;
end;
$$;

create trigger prepare_new_issue
  before insert on public.issues
  for each row execute function private.prepare_new_issue();

create function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger touch_issue_updated_at
  before update on public.issues
  for each row execute function private.touch_updated_at();

revoke all on function private.handle_new_user() from public;
revoke all on function private.claim_invitations() from public;
revoke all on function private.add_owner_as_admin() from public;
revoke all on function private.protect_project_owner() from public;
revoke all on function private.prepare_new_issue() from public;
revoke all on function private.touch_updated_at() from public;
