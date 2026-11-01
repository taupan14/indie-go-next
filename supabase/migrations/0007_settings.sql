-- Pengaturan aplikasi (bobot dan level popularitas dapat diubah dari panel admin)
create table app_settings (key text primary key, value jsonb not null);
alter table app_settings enable row level security;
create policy settings_read on app_settings for select to authenticated using (true);
create policy settings_admin on app_settings for all to authenticated using (is_super_admin()) with check (is_super_admin());
insert into app_settings (key, value) values ('popularity',
  '{"weights":{"vote":1,"comment":2,"share":3},"levels":{"active":50,"popular":150,"figure":300}}') on conflict do nothing;

create or replace function popularity_of(uid uuid) returns int language sql stable security definer set search_path = public as $$
  select
    ((select count(*) from votes v join threads t on t.id = v.thread_id join profiles p on p.id = v.user_id
        where t.author_id = uid and v.user_id <> uid and p.status = 'active' and t.status = 'published')
   + (select count(*) from votes v join comments c on c.id = v.comment_id join profiles p on p.id = v.user_id
        where c.author_id = uid and v.user_id <> uid and p.status = 'active' and c.status = 'published'))
      * coalesce((select (value -> 'weights' ->> 'vote')::int from app_settings where key = 'popularity'), 1)
  + (select count(*) from (select distinct c.thread_id, c.author_id from comments c
        join threads t on t.id = c.thread_id join profiles p on p.id = c.author_id
        where t.author_id = uid and c.author_id <> uid and p.status = 'active'
          and c.status = 'published' and t.status = 'published') x)
      * coalesce((select (value -> 'weights' ->> 'comment')::int from app_settings where key = 'popularity'), 2)
  + (select count(*) from shares s join threads t on t.id = s.thread_id join profiles p on p.id = s.user_id
        where t.author_id = uid and s.user_id <> uid and p.status = 'active' and t.status = 'published')
      * coalesce((select (value -> 'weights' ->> 'share')::int from app_settings where key = 'popularity'), 3)
$$;
