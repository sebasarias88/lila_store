-- ═══════════════════════════════════════════════════════════════════════
-- Lila Store · Wompi payments (Nov 2026). Additive only.
--   * payment_events: raw log of every Wompi notification (idempotent).
--   * apply_payment_event(): called by the server ONLY after the Wompi
--     signature (webhook) or the Wompi API (return page) was verified.
--     Checks the amount against the order total in the database.
--   * set_payment_reference(): new reference for a retry after a decline.
--   All three are service_role only (secret key on the server).
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  provider text not null default 'wompi',
  event text not null check (char_length(event) <= 60),
  transaction_id text not null check (char_length(transaction_id) <= 80),
  reference text check (char_length(reference) <= 40),
  status text not null check (char_length(status) <= 30),
  amount_in_cents bigint,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  unique (provider, transaction_id, status)
);
create index if not exists payment_events_reference_idx on public.payment_events (reference);

alter table public.payment_events enable row level security;
drop policy if exists payment_events_select_admin on public.payment_events;
create policy payment_events_select_admin on public.payment_events for select to authenticated using ((select private.is_admin()));
revoke all on public.payment_events from anon, authenticated;
grant select on public.payment_events to authenticated;

create or replace function public.apply_payment_event(
  p_event text,
  p_transaction_id text,
  p_reference text,
  p_status text,
  p_amount_in_cents bigint,
  p_payload jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_inserted int;
  v_payment_status text;
begin
  insert into public.payment_events (event, transaction_id, reference, status, amount_in_cents, payload)
  values (p_event, p_transaction_id, p_reference, upper(p_status), p_amount_in_cents, p_payload)
  on conflict (provider, transaction_id, status) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return 'duplicate';
  end if;

  select * into v_order from public.orders where payment_reference = p_reference for update;
  if not found then
    return 'order_not_found';
  end if;

  -- The amount paid must match exactly what the database says the order costs.
  if p_amount_in_cents is distinct from v_order.total * 100 then
    update public.orders
       set payment_status = 'error',
           internal_notes = left(coalesce(internal_notes || E'\n', '') || 'Wompi: el monto pagado no coincide (' || p_amount_in_cents / 100 || ' COP).', 2000)
     where id = v_order.id;
    return 'amount_mismatch';
  end if;

  v_payment_status := case upper(p_status)
    when 'APPROVED' then 'approved'
    when 'DECLINED' then 'declined'
    when 'VOIDED' then 'voided'
    when 'ERROR' then 'error'
    else 'pending'
  end;

  -- Never downgrade an order that is already paid (except a void/refund).
  if v_order.payment_status = 'approved' and v_payment_status <> 'voided' then
    return 'already_paid';
  end if;

  update public.orders
     set payment_status = v_payment_status,
         wompi_transaction_id = p_transaction_id,
         status = case
                    when v_payment_status = 'approved' and status in ('pending', 'awaiting_payment') then 'paid'
                    when v_payment_status = 'voided' then 'cancelled'
                    else status
                  end
   where id = v_order.id;

  return 'ok';
end;
$$;
revoke all on function public.apply_payment_event(text, text, text, text, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.apply_payment_event(text, text, text, text, bigint, jsonb) to service_role;

-- Retry after a declined/expired payment: Wompi needs a new reference each time.
create or replace function public.set_payment_reference(p_order_id uuid, p_reference text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.payment_kind <> 'wompi' then
    raise exception 'order_not_found' using errcode = '22023';
  end if;
  if v_order.payment_status = 'approved' or v_order.status not in ('pending', 'awaiting_payment') then
    raise exception 'not_payable' using errcode = '22023';
  end if;
  update public.orders
     set payment_reference = p_reference,
         payment_status = 'pending',
         status = 'awaiting_payment'
   where id = v_order.id
  returning * into v_order;
  return jsonb_build_object('order_number', v_order.order_number, 'total', v_order.total);
end;
$$;
revoke all on function public.set_payment_reference(uuid, text) from public, anon, authenticated;
grant execute on function public.set_payment_reference(uuid, text) to service_role;

-- Public, minimal view of an order for the payment result page (server-only).
create or replace function public.get_order_payment(p_reference text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'status', o.status,
    'payment_status', o.payment_status,
    'total', o.total
  )
  from public.orders o
  where o.payment_reference = p_reference;
$$;
revoke all on function public.get_order_payment(text) from public, anon, authenticated;
grant execute on function public.get_order_payment(text) to service_role;
