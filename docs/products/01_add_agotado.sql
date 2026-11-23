-- Lila Store · "Agotado" flag (Nov 2026)
-- Safe/additive: adds a column with default false. No existing data changes.
-- Run in Supabase → SQL Editor BEFORE deploying the feat/sold-out-flag code.

alter table public.productos
  add column if not exists agotado boolean not null default false;

comment on column public.productos.agotado is
  'Sold out: product stays visible in the catalog but cannot be bought.';

-- Small partial index: admin filter / dashboard count of sold-out products.
create index if not exists productos_agotado_idx
  on public.productos (agotado) where agotado;

-- Check:
-- select count(*) filter (where agotado) as agotados, count(*) as total from public.productos;
