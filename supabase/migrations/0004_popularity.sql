-- Poin popularitas: 1 per upvote, 2 per komentator unik pada thread, 3 per share.
-- Tidak dihitung: aksi diri sendiri, akun tidak aktif, dan konten yang disembunyikan.
-- Dihitung langsung saat profil dibuka (tanpa kolom cache), bobot bisa diubah di sini.
create function popularity_of(uid uuid) returns int language sql stable security definer set search_path = public as $$
  select
    (select count(*) from votes v join threads t on t.id = v.thread_id join profiles p on p.id = v.user_id
       where t.author_id = uid and v.user_id <> uid and p.status = 'active' and t.status = 'published')
  + (select count(*) from votes v join comments c on c.id = v.comment_id join profiles p on p.id = v.user_id
       where c.author_id = uid and v.user_id <> uid and p.status = 'active' and c.status = 'published')
  + 2 * (select count(*) from (select distinct c.thread_id, c.author_id from comments c
       join threads t on t.id = c.thread_id join profiles p on p.id = c.author_id
       where t.author_id = uid and c.author_id <> uid and p.status = 'active'
         and c.status = 'published' and t.status = 'published') x)
  + 3 * (select count(*) from shares s join threads t on t.id = s.thread_id join profiles p on p.id = s.user_id
       where t.author_id = uid and s.user_id <> uid and p.status = 'active' and t.status = 'published')
$$;
revoke all on function popularity_of(uuid) from public;
grant execute on function popularity_of(uuid) to authenticated;
