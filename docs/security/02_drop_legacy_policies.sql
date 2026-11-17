-- Step 2: remove the legacy "any logged-in user can write" policies.
-- Only the per-action policies from step 1 remain. Admin keeps working.
drop policy if exists anuncio_modal_write_auth on public.anuncio_modal;
drop policy if exists anuncio_modal_read_public on public.anuncio_modal;
drop policy if exists banners_write on public.banners;
drop policy if exists banners_read on public.banners;
drop policy if exists cats_write_auth on public.categorias;
drop policy if exists cats_read_public on public.categorias;
drop policy if exists config_write_auth on public.configuracion;
drop policy if exists config_read_public on public.configuracion;
drop policy if exists metodos_pago_write_auth on public.metodos_pago;
drop policy if exists metodos_pago_read_public on public.metodos_pago;
drop policy if exists prod_cats_write on public.producto_categorias;
drop policy if exists prod_cats_read on public.producto_categorias;
drop policy if exists secciones_write on public.producto_secciones;
drop policy if exists secciones_read on public.producto_secciones;
drop policy if exists prods_write_auth on public.productos;
drop policy if exists prods_read_public on public.productos;
drop policy if exists promociones_write on public.promociones;
drop policy if exists promociones_read on public.promociones;
drop policy if exists var_opciones_write on public.variacion_opciones;
drop policy if exists var_opciones_read on public.variacion_opciones;
drop policy if exists var_tipos_write on public.variacion_tipos;
drop policy if exists var_tipos_read on public.variacion_tipos;
-- storage (catalog buckets); public URLs keep working, listing becomes admin-only
drop policy if exists banners_storage_delete on storage.objects;
drop policy if exists banners_storage_write on storage.objects;
drop policy if exists banners_storage_read on storage.objects;
drop policy if exists storage_delete_auth on storage.objects;
drop policy if exists storage_upload_auth on storage.objects;
drop policy if exists storage_read_public on storage.objects;
