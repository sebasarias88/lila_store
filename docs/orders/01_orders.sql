-- ═══════════════════════════════════════════════════════════════════════
-- Lila Store · Orders (Nov 2026) — applied to Supabase project Lila-store.
--
-- Additive only: new tables + functions. Nothing existing is changed or deleted.
--
-- Security model (same as Innova):
--   * Customers NEVER write these tables directly (no anon policies at all).
--   * The Next.js server prices the cart with fresh DB data and calls
--     public.create_order() with the SECRET key (service_role only).
--   * Admins (private.is_admin()) read everything and may only update
--     workflow fields (status, carrier, tracking, notes, manual payment check).
--     Amounts and customer data are read-only for everyone.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity (start with 1001) unique,
  catalog text not null check (catalog in ('detal', 'mayoreo')),
  status text not null default 'pending'
    check (status in ('pending', 'awaiting_payment', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled')),

  -- Payment
  payment_method text not null check (char_length(payment_method) between 1 and 80),
  payment_kind text not null default 'other' check (payment_kind in ('wompi', 'transfer', 'other')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'approved', 'declined', 'voided', 'error')),
  payment_reference text unique check (char_length(payment_reference) <= 40),
  wompi_transaction_id text check (char_length(wompi_transaction_id) <= 80),
  receipt_path text check (receipt_path ~ '^receipts/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(webp|jpe?g|png|gif|pdf)$'),

  -- Customer (personal data: admin-only, anonymized on cleanup)
  customer_name text check (char_length(customer_name) between 2 and 120),
  customer_phone text check (customer_phone ~ '^\+?[0-9]{7,15}$'),
  document_type text check (document_type in ('CC', 'CE', 'NIT', 'PP', 'PEP', 'TI')),
  document_number text check (document_number ~ '^[0-9A-Za-z-]{4,20}$'),
  delivery_type text not null check (delivery_type in ('envio', 'recogida')),
  city text check (char_length(city) <= 120),
  city_code text check (city_code ~ '^[0-9]{8}$'),
  address text check (char_length(address) <= 200),
  pickup_branch text check (char_length(pickup_branch) <= 200),
  notes text check (char_length(notes) <= 500),

  -- Electronic invoice (optional, customer's choice)
  wants_invoice boolean not null default false,
  invoice_email text check (invoice_email is null or (char_length(invoice_email) <= 160 and invoice_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  invoice_name text check (char_length(invoice_name) <= 160),
  invoice_document_type text check (invoice_document_type in ('CC', 'CE', 'NIT', 'PP', 'PEP')),
  invoice_document_number text check (invoice_document_number ~ '^[0-9A-Za-z-]{4,20}$'),

  -- Amounts (COP, integers). shipping_cost NULL = "a convenir".
  shipping_label text check (char_length(shipping_label) <= 160),
  shipping_cost bigint check (shipping_cost is null or shipping_cost >= 0),
  surcharge_label text check (char_length(surcharge_label) <= 120),
  surcharge bigint not null default 0 check (surcharge >= 0),
  subtotal bigint not null check (subtotal >= 0),
  total bigint not null check (total >= 0),
  has_unpriced_items boolean not null default false,
  currency text not null default 'COP' check (currency = 'COP'),

  -- Fulfilment (admin)
  carrier text check (char_length(carrier) <= 80),
  tracking_number text check (char_length(tracking_number) <= 80),
  internal_notes text check (char_length(internal_notes) <= 2000),

  -- Consent proof (Ley 1581/2012, Decreto 1377/2013)
  privacy_version text check (char_length(privacy_version) <= 20),
  privacy_accepted_at timestamptz,

  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_document_idx on public.orders (document_number);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.productos (id) on delete set null,
  product_name text not null check (char_length(product_name) <= 200),
  product_sku text check (char_length(product_sku) <= 80),
  variations jsonb check (variations is null or jsonb_typeof(variations) = 'object'),
  unit_price bigint check (unit_price is null or unit_price >= 0),      -- NULL = "consultar precio"
  unit_price_before bigint check (unit_price_before is null or unit_price_before >= 0),
  quantity int not null check (quantity between 1 and 50),
  line_total bigint check (line_total is null or line_total >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- Timeline of status changes (who / when), shown in the order detail.
create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- Abuse protection: max orders per visitor (hashed IP, never the raw IP).
create table if not exists private.order_rate_limits (
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists order_rate_limits_idx on private.order_rate_limits (ip_hash, created_at desc);

-- ── Triggers ───────────────────────────────────────────────────────────
create or replace function private.orders_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();

  -- Online (Wompi) payment results only come from the verified webhook (service role).
  if new.payment_status is distinct from old.payment_status
     and old.payment_kind = 'wompi'
     and coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') <> 'service_role' then
    raise exception 'wompi_payment_locked' using errcode = '42501';
  end if;

  if new.payment_status = 'approved' and old.payment_status is distinct from 'approved' then
    new.paid_at := coalesce(new.paid_at, now());
    if new.status in ('pending', 'awaiting_payment') then new.status := 'paid'; end if;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'shipped' then new.shipped_at := coalesce(new.shipped_at, now()); end if;
    if new.status = 'delivered' then new.delivered_at := coalesce(new.delivered_at, now()); end if;
    if new.status = 'cancelled' then new.cancelled_at := now(); end if;
  end if;
  return new;
end;
$$;

create or replace function private.orders_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, (select auth.uid()));
  end if;
  return null;
end;
$$;
revoke all on function private.orders_before_update() from public, anon, authenticated;
revoke all on function private.orders_after_update() from public, anon, authenticated;

drop trigger if exists orders_before_update on public.orders;
create trigger orders_before_update before update on public.orders
  for each row execute function private.orders_before_update();
drop trigger if exists orders_after_update on public.orders;
create trigger orders_after_update after update on public.orders
  for each row execute function private.orders_after_update();

-- ── RLS: admins read/update; nobody inserts or deletes directly ────────
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table private.order_rate_limits enable row level security;

drop policy if exists orders_select_admin on public.orders;
create policy orders_select_admin on public.orders for select to authenticated using ((select private.is_admin()));
drop policy if exists orders_update_admin on public.orders;
create policy orders_update_admin on public.orders for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists order_items_select_admin on public.order_items;
create policy order_items_select_admin on public.order_items for select to authenticated using ((select private.is_admin()));
drop policy if exists order_status_history_select_admin on public.order_status_history;
create policy order_status_history_select_admin on public.order_status_history for select to authenticated using ((select private.is_admin()));

revoke all on public.orders, public.order_items, public.order_status_history from anon, authenticated;
grant select on public.orders, public.order_items, public.order_status_history to authenticated;
-- Admins may only change workflow fields: never amounts or customer data.
grant update (status, payment_status, carrier, tracking_number, internal_notes) on public.orders to authenticated;

-- ── create_order: only the server (secret key) can call it ─────────────
-- The server already priced every line with fresh DB data (lib/orders/pricing.ts).
-- Here we validate totals, rate-limit and insert atomically.
create or replace function public.create_order(p_order jsonb, p_items jsonb, p_ip_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_count int;
  v_recent int;
  v_item jsonb;
  v_subtotal bigint := 0;
  v_unpriced boolean := false;
begin
  if jsonb_typeof(p_order) <> 'object' or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  select count(*) into v_count from jsonb_array_elements(p_items);
  if v_count = 0 or v_count > 60 then
    raise exception 'invalid_items_count' using errcode = '22023';
  end if;

  -- Max 5 orders per visitor every 10 minutes.
  if p_ip_hash is not null then
    delete from private.order_rate_limits where created_at < now() - interval '1 day';
    select count(*) into v_recent from private.order_rate_limits
     where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes';
    if v_recent >= 5 then
      raise exception 'rate_limited' using errcode = '22023';
    end if;
    insert into private.order_rate_limits (ip_hash) values (p_ip_hash);
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if v_item ->> 'line_total' is null then
      v_unpriced := true;
    else
      v_subtotal := v_subtotal + (v_item ->> 'line_total')::bigint;
    end if;
  end loop;
  if v_subtotal <> (p_order ->> 'subtotal')::bigint then
    raise exception 'subtotal_mismatch' using errcode = '22023';
  end if;

  insert into public.orders (
    catalog, status, payment_method, payment_kind, payment_status, payment_reference, receipt_path,
    customer_name, customer_phone, document_type, document_number,
    delivery_type, city, city_code, address, pickup_branch, notes,
    wants_invoice, invoice_email, invoice_name, invoice_document_type, invoice_document_number,
    shipping_label, shipping_cost, surcharge_label, surcharge, subtotal, total, has_unpriced_items,
    privacy_version, privacy_accepted_at
  ) values (
    p_order ->> 'catalog',
    case when p_order ->> 'payment_kind' = 'wompi' then 'awaiting_payment' else 'pending' end,
    btrim(p_order ->> 'payment_method'),
    coalesce(p_order ->> 'payment_kind', 'other'),
    'pending',
    nullif(p_order ->> 'payment_reference', ''),
    nullif(p_order ->> 'receipt_path', ''),
    btrim(p_order ->> 'customer_name'),
    p_order ->> 'customer_phone',
    p_order ->> 'document_type',
    p_order ->> 'document_number',
    p_order ->> 'delivery_type',
    nullif(btrim(p_order ->> 'city'), ''),
    nullif(p_order ->> 'city_code', ''),
    nullif(btrim(p_order ->> 'address'), ''),
    nullif(btrim(p_order ->> 'pickup_branch'), ''),
    nullif(btrim(p_order ->> 'notes'), ''),
    coalesce((p_order ->> 'wants_invoice')::boolean, false),
    nullif(lower(btrim(p_order ->> 'invoice_email')), ''),
    nullif(btrim(p_order ->> 'invoice_name'), ''),
    nullif(p_order ->> 'invoice_document_type', ''),
    nullif(p_order ->> 'invoice_document_number', ''),
    nullif(p_order ->> 'shipping_label', ''),
    (p_order ->> 'shipping_cost')::bigint,
    nullif(p_order ->> 'surcharge_label', ''),
    coalesce((p_order ->> 'surcharge')::bigint, 0),
    v_subtotal,
    v_subtotal + coalesce((p_order ->> 'shipping_cost')::bigint, 0) + coalesce((p_order ->> 'surcharge')::bigint, 0),
    v_unpriced,
    nullif(p_order ->> 'privacy_version', ''),
    case when nullif(p_order ->> 'privacy_version', '') is not null then now() end
  )
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name, product_sku, variations,
                                  unit_price, unit_price_before, quantity, line_total)
  select v_order.id,
         (i ->> 'product_id')::uuid,
         i ->> 'product_name',
         nullif(i ->> 'product_sku', ''),
         case when jsonb_typeof(i -> 'variations') = 'object' then i -> 'variations' end,
         (i ->> 'unit_price')::bigint,
         (i ->> 'unit_price_before')::bigint,
         (i ->> 'quantity')::int,
         (i ->> 'line_total')::bigint
    from jsonb_array_elements(p_items) as i;

  insert into public.order_status_history (order_id, from_status, to_status)
  values (v_order.id, null, v_order.status);

  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'subtotal', v_order.subtotal,
    'shipping_cost', v_order.shipping_cost,
    'surcharge', v_order.surcharge,
    'total', v_order.total,
    'has_unpriced_items', v_order.has_unpriced_items,
    'created_at', v_order.created_at
  );
end;
$$;
revoke all on function public.create_order(jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb, text) to service_role;

-- Dashboard numbers (admin only): today / this month, Bogotá time.
create or replace function public.admin_order_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today timestamptz := date_trunc('day', now() at time zone 'America/Bogota') at time zone 'America/Bogota';
  v_month timestamptz := date_trunc('month', now() at time zone 'America/Bogota') at time zone 'America/Bogota';
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'today_orders', (select count(*) from public.orders where created_at >= v_today),
    'today_sales', (select coalesce(sum(total), 0) from public.orders where created_at >= v_today and status <> 'cancelled'),
    'month_orders', (select count(*) from public.orders where created_at >= v_month),
    'month_sales', (select coalesce(sum(total), 0) from public.orders where created_at >= v_month and status <> 'cancelled'),
    'month_paid_sales', (select coalesce(sum(total), 0) from public.orders where created_at >= v_month and payment_status = 'approved' and status <> 'cancelled'),
    'open_orders', (select count(*) from public.orders where status in ('pending', 'awaiting_payment', 'paid', 'preparing')),
    'to_ship', (select count(*) from public.orders where status in ('paid', 'preparing'))
  );
end;
$$;
revoke all on function public.admin_order_stats() from public, anon;
grant execute on function public.admin_order_stats() to authenticated;
