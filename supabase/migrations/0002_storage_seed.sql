-- Bucket foto (publik dibaca, hanya pemilik yang mengunggah ke foldernya)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy media_read on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy media_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- Kategori awal (ubah lewat panel admin nanti)
insert into categories (slug, name, color, sort) values
  ('teknologi', 'Teknologi', '#A80000', 1),
  ('desain', 'Desain', '#D9822B', 2),
  ('belajar', 'Belajar', '#3B6FB6', 3),
  ('hobi', 'Hobi', '#2E8B6E', 4),
  ('umum', 'Umum', '#7A6458', 5)
on conflict (slug) do nothing;
