-- Step 1 (additive, no behavior change): admin model + per-action policies.
-- Legacy permissive policies stay in place until 02_drop_legacy_policies.sql runs.

-- Snapshot of the current policies (for reference / rollback)
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists private.policies_backup_20261117 as
  select now() as taken_at, schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
  from pg_policies where schemaname in ('public', 'storage');

-- Admins
create table if not exists private.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on private.admin_users from public, anon, authenticated;

do $$
begin
  if (select count(*) from auth.users) <> 1 then
    raise exception 'Expected exactly one auth user to seed as admin';
  end if;
end $$;
insert into private.admin_users (user_id)
select id from auth.users
on conflict do nothing;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admin_users a where a.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- Tiny RPC for server routes (authenticated only)
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.is_admin(); $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Per-action policies on every catalog table
do $$
declare t text;
begin
  foreach t in array array[
    'anuncio_modal','banners','categorias','configuracion','metodos_pago',
    'producto_categorias','producto_secciones','productos','promociones',
    'variacion_opciones','variacion_tipos'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_public', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_select_public', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_admin', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))', t || '_insert_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_admin', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t || '_update_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_admin', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_admin()))', t || '_delete_admin', t);
  end loop;
end $$;

-- Storage: admin-only writes for catalog buckets (public URLs do not depend on these)
drop policy if exists storage_catalog_insert_admin on storage.objects;
create policy storage_catalog_insert_admin on storage.objects for insert to authenticated
  with check (bucket_id in ('productos','banners') and (select private.is_admin()));
drop policy if exists storage_catalog_update_admin on storage.objects;
create policy storage_catalog_update_admin on storage.objects for update to authenticated
  using (bucket_id in ('productos','banners') and (select private.is_admin()))
  with check (bucket_id in ('productos','banners') and (select private.is_admin()));
drop policy if exists storage_catalog_delete_admin on storage.objects;
create policy storage_catalog_delete_admin on storage.objects for delete to authenticated
  using (bucket_id in ('productos','banners') and (select private.is_admin()));
drop policy if exists storage_catalog_select_admin on storage.objects;
create policy storage_catalog_select_admin on storage.objects for select to authenticated
  using (bucket_id in ('productos','banners','comprobantes-pago') and (select private.is_admin()));

-- Least privilege (anon never had write policies, so this changes nothing for the site)
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
alter default privileges in schema public revoke insert, update, delete, truncate, references, trigger on tables from anon;
alter default privileges in schema public revoke truncate, references, trigger on tables from authenticated;

-- Fixed search_path on trigger functions (advisor warning)
alter function public.update_updated_at() set search_path = '';
alter function public.auto_agotar_por_stock() set search_path = '';
