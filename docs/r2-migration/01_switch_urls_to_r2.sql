-- STEP 2 of the R2 migration: point the catalog to R2.
-- Prerequisites:
--   1) scripts/migrate-images-to-r2.ts ran with 0 failures
--   2) scripts/output/r2-url-map.sql was executed (fills private.image_url_map)
--   3) https://img.lilastore.com.co/<some key> opens an image in the browser
--   4) The code with R2 uploads is live (otherwise new uploads still go to Supabase)
-- Safe: snapshots every current URL first (private.image_urls_before_r2) so it can be reverted.
begin;

create table if not exists private.image_urls_before_r2 as
  select 'productos'::text as tbl, id, imagenes as imgs, null::text as url from public.productos
  union all select 'categorias', id, null, imagen_url from public.categorias
  union all select 'banners', id, null, imagen_url from public.banners
  union all select 'promociones', id, null, imagen_url from public.promociones
  union all select 'anuncio_modal', id, null, imagen_url from public.anuncio_modal
  union all select 'variacion_opciones', id, null, imagen_url from public.variacion_opciones;
revoke all on private.image_urls_before_r2 from public, anon, authenticated;

update public.productos p
set imagenes = (
  select array_agg(coalesce(m.new_url, t.u) order by t.ord)
  from unnest(p.imagenes) with ordinality as t(u, ord)
  left join private.image_url_map m on m.old_url = t.u
)
where exists (
  select 1 from unnest(p.imagenes) u
  join private.image_url_map m on m.old_url = u
);

update public.categorias x set imagen_url = m.new_url
from private.image_url_map m where m.old_url = x.imagen_url;
update public.banners x set imagen_url = m.new_url
from private.image_url_map m where m.old_url = x.imagen_url;
update public.promociones x set imagen_url = m.new_url
from private.image_url_map m where m.old_url = x.imagen_url;
update public.anuncio_modal x set imagen_url = m.new_url
from private.image_url_map m where m.old_url = x.imagen_url;
update public.variacion_opciones x set imagen_url = m.new_url
from private.image_url_map m where m.old_url = x.imagen_url;

commit;

-- Verification: every count must be 0
select 'productos' tbl, count(*) remaining_supabase_urls from public.productos, unnest(imagenes) u where u like '%supabase.co%'
union all select 'categorias', count(*) from public.categorias where imagen_url like '%supabase.co%'
union all select 'banners', count(*) from public.banners where imagen_url like '%supabase.co%'
union all select 'promociones', count(*) from public.promociones where imagen_url like '%supabase.co%'
union all select 'anuncio_modal', count(*) from public.anuncio_modal where imagen_url like '%supabase.co%'
union all select 'variacion_opciones', count(*) from public.variacion_opciones where imagen_url like '%supabase.co%';
