-- Run ONLY after the code with the new receipt upload (receipts/<yyyy-mm>/<uuid>.<ext>)
-- is live in production. Removes the old rule that let anyone upload anything
-- anywhere in the receipts bucket. Already applied: receipts_insert_public.
drop policy if exists comprobantes_upload_publico on storage.objects;
drop policy if exists comprobantes_lectura_admin on storage.objects;
-- Rollback:
-- create policy comprobantes_upload_publico on storage.objects for insert with check (bucket_id = 'comprobantes-pago');
-- create policy comprobantes_lectura_admin on storage.objects for select using (bucket_id = 'comprobantes-pago' and auth.role() = 'authenticated');
