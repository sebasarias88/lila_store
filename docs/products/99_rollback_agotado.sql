-- Rollback (only if the feat/sold-out-flag code is NOT deployed).
drop index if exists public.productos_agotado_idx;
alter table public.productos drop column if exists agotado;
