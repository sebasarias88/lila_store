-- EMERGENCY ROLLBACK: restores the image URLs saved by 01_switch_urls_to_r2.sql.
-- Use only right after the switch: images added/edited AFTER the switch would be reverted too.
begin;
update public.productos p set imagenes = b.imgs
from private.image_urls_before_r2 b
where b.tbl = 'productos' and b.id = p.id and p.imagenes is distinct from b.imgs;
update public.categorias x set imagen_url = b.url from private.image_urls_before_r2 b
where b.tbl = 'categorias' and b.id = x.id and x.imagen_url is distinct from b.url;
update public.banners x set imagen_url = b.url from private.image_urls_before_r2 b
where b.tbl = 'banners' and b.id = x.id and x.imagen_url is distinct from b.url;
update public.promociones x set imagen_url = b.url from private.image_urls_before_r2 b
where b.tbl = 'promociones' and b.id = x.id and x.imagen_url is distinct from b.url;
update public.anuncio_modal x set imagen_url = b.url from private.image_urls_before_r2 b
where b.tbl = 'anuncio_modal' and b.id = x.id and x.imagen_url is distinct from b.url;
update public.variacion_opciones x set imagen_url = b.url from private.image_urls_before_r2 b
where b.tbl = 'variacion_opciones' and b.id = x.id and x.imagen_url is distinct from b.url;
commit;
