-- Búsqueda de productos sin acentos (catálogo + admin).
-- Ejecutar en Supabase SQL Editor del proyecto lila-store.

create extension if not exists unaccent;

create or replace function public.search_productos_unaccent(search_query text)
returns table (id uuid)
language sql
stable
as $$
  select p.id
  from public.productos p
  where
    length(trim(search_query)) > 0
    and (
      unaccent(lower(coalesce(p.nombre, '')))
        like '%' || unaccent(lower(trim(search_query))) || '%'
      or unaccent(lower(coalesce(p.sku, '')))
        like '%' || unaccent(lower(trim(search_query))) || '%'
      or unaccent(lower(coalesce(p.marca, '')))
        like '%' || unaccent(lower(trim(search_query))) || '%'
    )
  order by p.orden asc, p.created_at desc;
$$;

grant execute on function public.search_productos_unaccent(text) to anon, authenticated;
