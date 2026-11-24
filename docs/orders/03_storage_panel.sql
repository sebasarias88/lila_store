-- ═══════════════════════════════════════════════════════════════════════
-- Lila Store · Admin → Almacenamiento (Nov 2026). Additive only.
-- Every function checks private.is_admin(). Nothing here deletes products,
-- categories, banners, settings or open orders.
-- ═══════════════════════════════════════════════════════════════════════

-- What takes space (database + Supabase Storage buckets).
create or replace function public.admin_storage_usage()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'database_bytes', pg_database_size(current_database()),
    'buckets', coalesce((
      select jsonb_agg(jsonb_build_object('bucket', bucket_id, 'files', files, 'bytes', bytes) order by bytes desc)
      from (select bucket_id, count(*) files, coalesce(sum((metadata ->> 'size')::bigint), 0) bytes
              from storage.objects group by bucket_id) b
    ), '[]'::jsonb),
    'tables', (
      select jsonb_agg(jsonb_build_object('name', t.name, 'bytes', pg_total_relation_size(t.reg), 'rows', t.rows)
                       order by pg_total_relation_size(t.reg) desc)
      from (values
        ('productos', 'public.productos'::regclass, (select count(*) from public.productos)),
        ('producto_secciones', 'public.producto_secciones'::regclass, (select count(*) from public.producto_secciones)),
        ('variacion_opciones', 'public.variacion_opciones'::regclass, (select count(*) from public.variacion_opciones)),
        ('categorias', 'public.categorias'::regclass, (select count(*) from public.categorias)),
        ('orders', 'public.orders'::regclass, (select count(*) from public.orders)),
        ('order_items', 'public.order_items'::regclass, (select count(*) from public.order_items)),
        ('payment_events', 'public.payment_events'::regclass, (select count(*) from public.payment_events)),
        ('order_status_history', 'public.order_status_history'::regclass, (select count(*) from public.order_status_history))
      ) as t(name, reg, rows)
    ),
    'oldest_finished_order', (select min(created_at) from public.orders
                               where status in ('delivered', 'cancelled') and anonymized_at is null)
  );
end;
$$;
revoke all on function public.admin_storage_usage() from public, anon;
grant execute on function public.admin_storage_usage() to authenticated;

-- Every media URL the store uses (to find unused files in R2).
create or replace function public.admin_referenced_media()
returns setof text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select unnest(imagenes) from public.productos where imagenes is not null
    union select video_url from public.productos where video_url is not null
    union select v ->> 'url' from public.productos, jsonb_array_elements(coalesce(videos, '[]'::jsonb)) v
    union select imagen_url from public.variacion_opciones where imagen_url is not null
    union select imagen_url from public.categorias where imagen_url is not null
    union select imagen_url from public.banners where imagen_url is not null
    union select imagen_url from public.promociones where imagen_url is not null
    union select imagen_url from public.anuncio_modal where imagen_url is not null;
end;
$$;
revoke all on function public.admin_referenced_media() from public, anon;
grant execute on function public.admin_referenced_media() to authenticated;

-- How much each cleanup would free (nothing is deleted here).
create or replace function public.admin_cleanup_preview(p_cutoff date, p_receipt_months int)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_limit timestamptz := (p_cutoff::timestamp at time zone 'America/Bogota');
  v_receipts_before timestamptz := now() - make_interval(months => greatest(p_receipt_months, 3));
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'orders', (select count(*) from public.orders
                where created_at < v_limit and status in ('delivered', 'cancelled') and anonymized_at is null),
    'receipts', (select jsonb_build_object('files', count(*), 'bytes', coalesce(sum((o.metadata ->> 'size')::bigint), 0))
                   from storage.objects o
                  where o.bucket_id = 'comprobantes-pago' and o.created_at < v_receipts_before
                    and not exists (select 1 from public.orders r where r.receipt_path = o.name
                                     and r.status not in ('delivered', 'cancelled'))),
    'legacy_images', (select jsonb_build_object('files', count(*), 'bytes', coalesce(sum((o.metadata ->> 'size')::bigint), 0))
                        from storage.objects o where o.bucket_id in ('productos', 'banners')),
    -- Safety check: must be 0 before old Supabase images can be removed.
    'legacy_references', (
      (select count(*) from public.productos where array_to_string(imagenes, ' ') like '%supabase.co/storage%')
      + (select count(*) from public.variacion_opciones where imagen_url like '%supabase.co/storage%')
      + (select count(*) from public.categorias where imagen_url like '%supabase.co/storage%')
      + (select count(*) from public.banners where imagen_url like '%supabase.co/storage%')
      + (select count(*) from public.promociones where imagen_url like '%supabase.co/storage%')
      + (select count(*) from public.anuncio_modal where imagen_url like '%supabase.co/storage%')
    )
  );
end;
$$;
revoke all on function public.admin_cleanup_preview(date, int) from public, anon;
grant execute on function public.admin_cleanup_preview(date, int) to authenticated;

-- Removes the PERSONAL data of finished orders (delivered/cancelled) older than
-- the cut-off. Products, amounts and dates stay for sales history.
-- Returns the receipt files that the server must delete from Storage.
create or replace function public.admin_anonymize_orders(p_cutoff date, p_confirm text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit timestamptz := (p_cutoff::timestamp at time zone 'America/Bogota');
  v_ids uuid[];
  v_receipts text[];
  v_refs text[];
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if upper(btrim(coalesce(p_confirm, ''))) <> 'LIMPIAR' then
    raise exception 'confirmation_required' using errcode = '22023';
  end if;
  if p_cutoff > (now() at time zone 'America/Bogota')::date - 30 then
    raise exception 'cutoff_too_recent' using errcode = '22023';
  end if;

  select array_agg(id), array_agg(receipt_path) filter (where receipt_path is not null),
         array_agg(payment_reference) filter (where payment_reference is not null)
    into v_ids, v_receipts, v_refs
    from public.orders
   where created_at < v_limit and status in ('delivered', 'cancelled') and anonymized_at is null;

  if v_ids is null then
    return jsonb_build_object('orders', 0, 'receipts', '[]'::jsonb);
  end if;

  update public.orders
     set customer_name = null, customer_phone = null, document_type = null, document_number = null,
         address = null, pickup_branch = null, notes = null,
         invoice_email = null, invoice_name = null, invoice_document_type = null, invoice_document_number = null,
         receipt_path = null, internal_notes = null, anonymized_at = now()
   where id = any (v_ids);

  -- Wompi payloads can contain the payer's e-mail/name.
  delete from public.payment_events where reference = any (coalesce(v_refs, '{}'));

  return jsonb_build_object('orders', cardinality(v_ids), 'receipts', to_jsonb(coalesce(v_receipts, '{}')));
end;
$$;
revoke all on function public.admin_anonymize_orders(date, text) from public, anon;
grant execute on function public.admin_anonymize_orders(date, text) to authenticated;

-- Receipt files older than N months not linked to an open order.
create or replace function public.admin_old_receipt_paths(p_months int)
returns setof text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select o.name from storage.objects o
     where o.bucket_id = 'comprobantes-pago'
       and o.created_at < now() - make_interval(months => greatest(p_months, 3))
       and not exists (select 1 from public.orders r where r.receipt_path = o.name
                        and r.status not in ('delivered', 'cancelled'));
end;
$$;
revoke all on function public.admin_old_receipt_paths(int) from public, anon;
grant execute on function public.admin_old_receipt_paths(int) to authenticated;

-- Old Supabase copies of the catalog images (already moved to R2).
-- Returns nothing while any record still points to Supabase Storage.
create or replace function public.admin_legacy_image_paths()
returns table (bucket text, name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if ((public.admin_cleanup_preview(current_date - 31, 12)) ->> 'legacy_references')::int > 0 then
    return;
  end if;
  return query select o.bucket_id::text, o.name from storage.objects o where o.bucket_id in ('productos', 'banners');
end;
$$;
revoke all on function public.admin_legacy_image_paths() from public, anon;
grant execute on function public.admin_legacy_image_paths() to authenticated;
