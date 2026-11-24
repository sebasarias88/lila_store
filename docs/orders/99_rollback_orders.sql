-- Rollback (only BEFORE real orders exist, or after exporting them):
drop function if exists public.admin_order_stats();
drop function if exists public.create_order(jsonb, jsonb, text);
drop table if exists public.order_status_history;
drop table if exists public.order_items;
drop table if exists public.orders;
drop table if exists private.order_rate_limits;
drop function if exists private.orders_before_update();
drop function if exists private.orders_after_update();
